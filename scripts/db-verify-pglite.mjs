#!/usr/bin/env node
/**
 * Applies every migration to an in-memory Postgres (PGlite) and checks the recipe RLS rules with
 * two fake users. Runs anywhere Node runs (no Docker), e.g. in Claude Code cloud sessions.
 * Usage: npm run db:verify
 * Note: PGlite aborts with a generic message when a plpgsql function raises, so for denied RPC
 * calls only the denial itself is checked here; the exact QC_* codes are covered by
 * tests/integration against the test project.
 */
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Minimal stand-ins for the Supabase auth/storage schemas and pgcrypto so migrations can run in
// PGlite (Postgres in WASM). Not a replacement for tests against the real test project.
const stub = `
create role anon nologin; create role authenticated nologin; create role service_role nologin;
create schema auth; create schema storage; create schema extensions;
create function extensions.gen_random_bytes(n int) returns bytea language sql volatile as $$ select substring(decode(replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-',''),'hex') from 1 for n) $$;
create function extensions.digest(t text, alg text) returns bytea language sql immutable as $$ select sha256(convert_to(t,'UTF8')) $$;
grant execute on all functions in schema extensions to authenticated;
create table auth.users (id uuid primary key, raw_user_meta_data jsonb default '{}'::jsonb, email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth, storage, public, extensions to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
alter table storage.objects enable row level security;
grant select, insert, update, delete on storage.objects to authenticated;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
grant execute on function storage.foldername(text) to authenticated;
`;
const MIGRATIONS = new URL('../supabase/migrations/', import.meta.url).pathname;
const A = '00000000-0000-0000-0000-00000000000a',
  B = '00000000-0000-0000-0000-00000000000b';
async function setup() {
  const db = new PGlite();
  await db.exec(stub);
  for (const f of readdirSync(MIGRATIONS)
    .filter((n) => n.endsWith('.sql'))
    .sort())
    await db.exec(readFileSync(join(MIGRATIONS, f), 'utf8').replace(/create extension[^;]*;/, ''));
  await db.exec(
    `insert into auth.users (id, raw_user_meta_data) values ('${A}','{"display_name":"A"}'),('${B}','{"display_name":"B"}')`,
  );
  const as = async (uid, sql, params) => {
    await db.exec(
      `reset role; select set_config('request.jwt.claim.sub','${uid}',false); set role authenticated;`,
    );
    try {
      return await db.query(sql, params);
    } finally {
      await db.exec('reset role');
    }
  };
  const h = (await as(A, `select public.create_household('Casa A') as id`)).rows[0].id;
  const recipe = {
    household_id: h,
    title: 'Arroz',
    base_servings: 4,
    ingredients: [
      { original_text: '400 g de arroz', quantity: 400, unit: 'g', name: 'arroz' },
      { original_text: 'sal al gusto', name: 'sal', scalable: false },
    ],
    steps: [{ body: 'Cocer' }, { body: 'Servir' }],
  };
  const id = (await as(A, `select public.save_recipe($1) as id`, [recipe])).rows[0].id;
  return { db, as, h, id, recipe };
}
const cases = {
  'B save into A household': (c) => c.as(B, `select public.save_recipe($1)`, [c.recipe]),
  'B update A recipe via save': (c) =>
    c.as(B, `select public.save_recipe($1)`, [{ ...c.recipe, id: c.id }]),
  'B direct ingredient insert': (c) =>
    c.as(
      B,
      `insert into public.recipe_ingredients (recipe_id, household_id, position, original_text, name) values ($1,$2,9,'x','x')`,
      [c.id, c.h],
    ),
  'B favorite A recipe': (c) =>
    c.as(B, `insert into public.recipe_user_state (recipe_id, favorite) values ($1, true)`, [c.id]),
  'B upload photo': (c) =>
    c.as(B, `insert into storage.objects (bucket_id, name) values ('recipe-photos', $1)`, [
      `${c.h}/${c.id}/a.webp`,
    ]),
  'B delete recipe': async (c) => {
    const r = await c.as(B, `delete from public.recipes where id=$1`, [c.id]);
    if (!r.affectedRows) throw new Error('0 rows');
    return r;
  },
  'A empty ingredients': (c) =>
    c.as(A, `select public.save_recipe($1)`, [{ ...c.recipe, ingredients: [] }]),
  'A forge created_by': (c) =>
    c.as(
      A,
      `insert into public.recipes (household_id, title, base_servings, created_by) values ($1,'x',1,$2)`,
      [c.h, B],
    ),
  'A link category of other household': async (c) => {
    await c.db
      .exec(
        `insert into public.households (id,name) values ('00000000-0000-0000-0000-0000000000cc','X')`,
      )
      .catch(() => {});
    await c.db.exec(
      `insert into public.recipe_categories (id, household_id, name) values ('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000cc','Otra')`,
    );
    return c.as(A, `select public.save_recipe($1)`, [
      { ...c.recipe, id: c.id, category_ids: ['00000000-0000-0000-0000-0000000000c1'] },
    ]);
  },
};
let failures = 0;
for (const [label, fn] of Object.entries(cases)) {
  const c = await setup();
  try {
    await fn(c);
    console.log('ALLOWED?!', label);
    failures++;
  } catch (e) {
    console.log('denied ok:', label, '→', e.message.slice(0, 80));
  }
}
const c = await setup();
const { as, id, recipe, h } = c;
await as(A, `select public.save_recipe($1)`, [
  { ...recipe, id, ingredients: [recipe.ingredients[1]], tags: ['x', ' x '] },
]);
console.log(
  'after edit',
  (await as(A, `select count(*)::int n from public.recipe_ingredients`)).rows,
  (await as(A, `select tags from public.recipes`)).rows,
);
await as(
  A,
  `insert into public.recipe_user_state (recipe_id, favorite, rating) values ($1, true, 5)`,
  [id],
);
console.log(
  'A fav',
  (await as(A, `select favorite, rating, user_id = '${A}' as mine from public.recipe_user_state`))
    .rows,
);
await as(A, `insert into storage.objects (bucket_id, name) values ('recipe-photos', $1)`, [
  `${h}/${id}/a.webp`,
]);
console.log(
  'photo rows B',
  (await as(B, `select count(*)::int n from storage.objects`)).rows,
  'A',
  (await as(A, `select count(*)::int n from storage.objects`)).rows,
);
const cat = (
  await as(
    A,
    `insert into public.recipe_categories (household_id, name) values ($1,'Arroces') returning id`,
    [h],
  )
).rows[0].id;
await as(A, `select public.save_recipe($1)`, [{ ...recipe, id, category_ids: [cat] }]);
console.log(
  'links',
  (await as(A, `select count(*)::int n from public.recipe_category_links`)).rows,
);
await as(A, `update public.recipes set archived_at = now() where id = $1`, [id]);
console.log(
  'archived',
  (await as(A, `select archived_at is not null as a from public.recipes`)).rows,
);
await as(A, `delete from public.recipes where id = $1`, [id]);
console.log(
  'deleted; steps left',
  (await as(A, `select count(*)::int n from public.recipe_steps`)).rows,
);

if (failures) {
  console.error(`${failures} check(s) failed`);
  process.exit(1);
}
console.log('db:verify OK');
