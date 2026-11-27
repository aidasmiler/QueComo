#!/usr/bin/env node
/**
 * PGlite checks for smart classification storage
 * (supabase/migrations/20261127180000_recipe_classification.sql):
 * - only owners write keywords on custom catalog items; members read them;
 * - dismissed suggestions and optional utensils are saved by save_recipe v3 (and kept when
 *   a v2 payload omits them);
 * - household isolation for optional utensils; malformed payloads are rejected.
 * Usage: npm run db:verify (runs after the other db-verify scripts).
 */
import { A, B, C, setup } from './lib/pglite.mjs';

let failures = 0;
const fail = (msg) => {
  console.error('FAIL:', msg);
  failures++;
};
const eq = (label, actual, expected) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) console.log('ok:', label);
  else fail(`${label}: expected ${e}, got ${a}`);
};

async function world() {
  const c = await setup();
  const { as, h } = c;
  const token = (await as(A, `select token from public.create_household_invitation($1)`, [h]))
    .rows[0].token;
  await as(B, `select public.accept_household_invitation($1)`, [token]);
  const hc = (await as(C, `select public.create_household('Casa C') as id`)).rows[0].id;
  return { ...c, hc };
}
const one = async (as, uid, sql, params) => (await as(uid, sql, params)).rows[0];
const mustAffect = (r) => {
  if (!r.affectedRows) throw new Error('0 rows');
};

// --- Denied (fresh DB each: PGlite aborts on plpgsql RAISE) -----------------------------------
const denied = {
  'member creates a tag with keywords': (w) =>
    w.as(
      B,
      `insert into public.household_tags (household_id, name, keywords) values ($1,'Cumple','{tarta}')`,
      [w.h],
    ),
  'member edits keywords of a custom category': async (w) => {
    await w.as(
      A,
      `insert into public.recipe_categories (household_id, name) values ($1,'Tuppers')`,
      [w.h],
    );
    mustAffect(
      await w.as(
        B,
        `update public.recipe_categories set keywords = '{x}' where household_id = $1`,
        [w.h],
      ),
    );
  },
  'member edits keywords of a custom utensil': async (w) => {
    await w.as(
      A,
      `insert into public.household_utensils (household_id, name) values ($1,'Mambo')`,
      [w.h],
    );
    mustAffect(
      await w.as(
        B,
        `update public.household_utensils set keywords = '{x}' where household_id = $1`,
        [w.h],
      ),
    );
  },
  'outsider edits keywords of another household': async (w) => {
    await w.as(A, `insert into public.household_tags (household_id, name) values ($1,'Cumple')`, [
      w.h,
    ]);
    mustAffect(await w.as(C, `update public.household_tags set keywords = '{x}'`));
  },
  'more than 20 keywords': (w) =>
    w.as(A, `insert into public.household_tags (household_id, name, keywords) values ($1,'X',$2)`, [
      w.h,
      Array.from({ length: 21 }, (_, i) => `k${i}`),
    ]),
  'malformed dismissed suggestion': (w) =>
    w.as(A, `select public.save_recipe($1)`, [
      { ...w.recipe, id: w.id, dismissed_suggestions: ['category:pasta'] },
    ]),
  'too many dismissed suggestions': (w) =>
    w.as(A, `select public.save_recipe($1)`, [
      {
        ...w.recipe,
        id: w.id,
        dismissed_suggestions: Array.from({ length: 101 }, (_, i) => `tag:def:t${i}x`),
      },
    ]),
  'optional custom utensil of another household': async (w) => {
    const u = await one(
      w.as,
      A,
      `insert into public.household_utensils (household_id, name) values ($1,'Mambo') returning id`,
      [w.h],
    );
    await w.as(C, `select public.save_recipe($1)`, [
      { ...w.recipe, household_id: w.hc, optional_utensils: [{ custom: u.id }] },
    ]);
  },
  'outsider reads optional utensils': async (w) => {
    await w.as(A, `select public.save_recipe($1)`, [
      { ...w.recipe, id: w.id, optional_utensils: [{ def: 'grater' }] },
    ]);
    const r = await w.as(C, `select * from public.recipe_optional_utensils`);
    if (!r.rows.length) throw new Error('0 rows visible');
  },
  'member writes dismissed suggestions directly with junk size': (w) =>
    w.as(B, `update public.recipes set dismissed_suggestions = $2 where id = $1`, [
      w.id,
      Array.from({ length: 101 }, () => 'x'),
    ]),
};
for (const [label, fn] of Object.entries(denied)) {
  const w = await world();
  try {
    await fn(w);
    fail(`ALLOWED: ${label}`);
  } catch (e) {
    console.log('denied ok:', label, '→', e.message.slice(0, 70));
  }
}

// --- Allowed flows ----------------------------------------------------------------------------
const w = await world();
const { as, h, id, recipe } = w;

const tag = await one(
  as,
  A,
  `insert into public.household_tags (household_id, name, keywords) values ($1,'Cumple','{tarta,celebración}') returning id`,
  [h],
);
await as(A, `update public.household_tags set keywords = '{fiesta}' where id = $1`, [tag.id]);
const cat = await one(
  as,
  A,
  `insert into public.recipe_categories (household_id, name, keywords) values ($1,'Tuppers','{taper}') returning id`,
  [h],
);
const ut = await one(
  as,
  A,
  `insert into public.household_utensils (household_id, name, keywords) values ($1,'Mambo','{robot}') returning id`,
  [h],
);
eq(
  'member reads owner keywords',
  (
    await as(
      B,
      `select keywords from public.household_tags union all select keywords from public.recipe_categories union all select keywords from public.household_utensils`,
    )
  ).rows.map((r) => r.keywords),
  [['fiesta'], ['taper'], ['robot']],
);
eq(
  'outsider sees no keywords',
  (await as(C, `select keywords from public.household_tags`)).rows.length,
  0,
);

// v3 payload saved by a member
await as(B, `select public.save_recipe($1)`, [
  {
    ...recipe,
    id,
    dismissed_suggestions: ['category:def:eggs', `tag:custom:${tag.id}`, 'category:def:eggs'],
    optional_utensils: [{ def: 'grater' }, { custom: ut.id }],
    categories: [{ custom: cat.id }],
  },
]);
eq(
  'dismissed suggestions saved (deduplicated)',
  (await one(as, A, `select dismissed_suggestions d from public.recipes where id = $1`, [id])).d
    .slice()
    .sort(),
  ['category:def:eggs', `tag:custom:${tag.id}`].sort(),
);
eq(
  'optional utensils saved',
  (
    await as(
      A,
      `select utensil_def_id, household_utensil_id from public.recipe_optional_utensils where recipe_id = $1 order by utensil_def_id nulls last`,
      [id],
    )
  ).rows,
  [
    { utensil_def_id: 'grater', household_utensil_id: null },
    { utensil_def_id: null, household_utensil_id: ut.id },
  ],
);

// v2 payload (no new keys) keeps both
await as(A, `select public.save_recipe($1)`, [{ ...recipe, id, title: 'Arroz v2' }]);
eq(
  'v2 payload keeps dismissed and optional utensils',
  await one(
    as,
    A,
    `select r.title, cardinality(r.dismissed_suggestions) d,
      (select count(*)::int from public.recipe_optional_utensils o where o.recipe_id = r.id) o
     from public.recipes r where r.id = $1`,
    [id],
  ),
  { title: 'Arroz v2', d: 2, o: 2 },
);

// Clearing
await as(A, `select public.save_recipe($1)`, [
  { ...recipe, id, dismissed_suggestions: [], optional_utensils: [] },
]);
eq(
  'empty arrays clear both',
  await one(
    as,
    A,
    `select cardinality(r.dismissed_suggestions) d,
      (select count(*)::int from public.recipe_optional_utensils o where o.recipe_id = r.id) o
     from public.recipes r where r.id = $1`,
    [id],
  ),
  { d: 0, o: 0 },
);

// New recipe with v3 keys
const created = await one(as, B, `select public.save_recipe($1) as id`, [
  { ...recipe, title: 'Nueva', dismissed_suggestions: ['utensil:def:oven'] },
]);
eq(
  'new recipe stores dismissed suggestions',
  (
    await one(as, A, `select dismissed_suggestions d from public.recipes where id = $1`, [
      created.id,
    ])
  ).d,
  ['utensil:def:oven'],
);

// Deleting a custom utensil removes it from optional lists
await as(A, `select public.save_recipe($1)`, [
  { ...recipe, id, optional_utensils: [{ custom: ut.id }] },
]);
await as(A, `delete from public.household_utensils where id = $1`, [ut.id]);
eq(
  'custom utensil deletion cascades to optional lists',
  (await one(as, A, `select count(*)::int n from public.recipe_optional_utensils`)).n,
  0,
);

if (failures) {
  console.error(`\n${failures} classification check(s) failed`);
  process.exit(1);
}
console.log('\nAll classification checks passed');
