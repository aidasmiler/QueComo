#!/usr/bin/env node
/**
 * Applies every migration to an in-memory Postgres (PGlite) and checks the recipe RLS rules with
 * two fake users. Runs anywhere Node runs (no Docker), e.g. in Claude Code cloud sessions.
 * Usage: npm run db:verify
 * Note: PGlite aborts with a generic message when a plpgsql function raises, so for denied RPC
 * calls only the denial itself is checked here; the exact QC_* codes are covered by
 * tests/integration against the test project.
 */
import { A, B, setup } from './lib/pglite.mjs';

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
  // Regression guard: a PostgREST-style upsert also SETs recipe_id, which is not updatable.
  'A favourite via upsert (recipe_id not updatable)': async (c) => {
    const sql = `insert into public.recipe_user_state (recipe_id, favorite) values ($1, true)
      on conflict (user_id, recipe_id) do update set recipe_id = excluded.recipe_id, favorite = excluded.favorite`;
    await c.as(A, sql, [c.id]);
    return c.as(A, sql, [c.id]);
  },
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
// The app toggles favourites with a plain UPDATE of the granted columns (not an upsert).
await as(A, `update public.recipe_user_state set favorite = false where recipe_id = $1`, [id]);
await as(A, `update public.recipe_user_state set favorite = true where recipe_id = $1`, [id]);
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
