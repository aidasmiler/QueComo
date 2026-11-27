/**
 * Shared PGlite harness for db:verify scripts: applies every migration with Supabase stubs and
 * returns helpers to run SQL as a given user (role "authenticated").
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
const MIGRATIONS = new URL('../../supabase/migrations/', import.meta.url).pathname;
export const A = '00000000-0000-0000-0000-00000000000a',
  B = '00000000-0000-0000-0000-00000000000b',
  C = '00000000-0000-0000-0000-00000000000c';
/**
 * @param {{ before?: { file: string, run: (db: PGlite) => Promise<void> } }} [options]
 *   `before.run` is called (as superuser) right before applying migration `before.file`, to seed
 *   data that a data migration must preserve.
 */
export async function setup(options = {}) {
  const db = new PGlite();
  await db.exec(stub);
  for (const f of readdirSync(MIGRATIONS)
    .filter((n) => n.endsWith('.sql'))
    .sort()) {
    if (options.before?.file === f) await options.before.run(db);
    await db.exec(readFileSync(join(MIGRATIONS, f), 'utf8').replace(/create extension[^;]*;/, ''));
  }
  await db.exec(
    `insert into auth.users (id, raw_user_meta_data) values ('${A}','{"display_name":"A"}'),('${B}','{"display_name":"B"}'),('${C}','{"display_name":"C"}') on conflict do nothing`,
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
