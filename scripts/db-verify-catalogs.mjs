#!/usr/bin/env node
/**
 * PGlite checks for recipe catalogs, equipment and cooking history
 * (supabase/migrations/20261127120000_recipe_catalogs.sql):
 * - owner-only management of custom categories/tags/utensils and hidden items;
 * - members can use catalogs, tick equipment and log cooking;
 * - ownership transfer moves the management rights;
 * - household isolation, atomic saves and the legacy text[] tag migration.
 * Usage: npm run db:verify (runs after db-verify-pglite.mjs).
 */
import { A, B, C, setup } from './lib/pglite.mjs';

const CATALOGS = '20261127120000_recipe_catalogs.sql';
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

/** A owns household h; B joins it as a member; C has a separate household hc. */
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

// --- Denied for members / outsiders (fresh DB each: PGlite aborts on plpgsql RAISE) ----------
const denied = {
  'member creates custom category': (w) =>
    w.as(B, `insert into public.recipe_categories (household_id, name) values ($1,'Tuppers')`, [w.h]),
  'member creates custom tag': (w) =>
    w.as(B, `insert into public.household_tags (household_id, name) values ($1,'Cumple')`, [w.h]),
  'member creates custom utensil': (w) =>
    w.as(B, `insert into public.household_utensils (household_id, name) values ($1,'Thermomix')`, [
      w.h,
    ]),
  'member hides a global category': (w) =>
    w.as(
      B,
      `insert into public.household_hidden_items (household_id, kind, item_id) values ($1,'category','drinks')`,
      [w.h],
    ),
  'member renames owner tag': async (w) => {
    await w.as(A, `insert into public.household_tags (household_id, name) values ($1,'Cumple')`, [w.h]);
    const r = await w.as(B, `update public.household_tags set name = 'X' where household_id = $1`, [w.h]);
    if (!r.affectedRows) throw new Error('0 rows');
  },
  'member deletes owner utensil': async (w) => {
    await w.as(A, `insert into public.household_utensils (household_id, name) values ($1,'Thermomix')`, [
      w.h,
    ]);
    const r = await w.as(B, `delete from public.household_utensils where household_id = $1`, [w.h]);
    if (!r.affectedRows) throw new Error('0 rows');
  },
  'member recolours owner category': async (w) => {
    await w.as(A, `insert into public.recipe_categories (household_id, name) values ($1,'Tuppers')`, [
      w.h,
    ]);
    const r = await w.as(B, `update public.recipe_categories set color = 'red' where household_id = $1`, [
      w.h,
    ]);
    if (!r.affectedRows) throw new Error('0 rows');
  },
  'owner edits a global category': (w) =>
    w.as(A, `update public.category_definitions set name_es = 'X' where id = 'pasta'`),
  'owner deletes a global utensil': (w) =>
    w.as(A, `delete from public.utensil_definitions where id = 'oven'`),
  'owner adds a global tag': (w) =>
    w.as(
      A,
      `insert into public.tag_definitions (id, tag_group, position, name_es, name_en) values ('x','diet',9,'X','X')`,
    ),
  'custom name equal to a global one': (w) =>
    w.as(A, `insert into public.recipe_categories (household_id, name) values ($1,' pasta ')`, [w.h]),
  'outsider reads custom tags': async (w) => {
    await w.as(A, `insert into public.household_tags (household_id, name) values ($1,'Cumple')`, [w.h]);
    const r = await w.as(C, `select * from public.household_tags`);
    if (!r.rows.length) throw new Error('0 rows visible');
  },
  'outsider links a custom tag of another household': async (w) => {
    const tag = await one(
      w.as,
      A,
      `insert into public.household_tags (household_id, name) values ($1,'Cumple') returning id`,
      [w.h],
    );
    await w.as(C, `select public.save_recipe($1)`, [
      { ...w.recipe, household_id: w.hc, tag_links: [{ custom: tag.id }] },
    ]);
  },
  'outsider uses a custom utensil of another household': async (w) => {
    const u = await one(
      w.as,
      A,
      `insert into public.household_utensils (household_id, name) values ($1,'Thermomix') returning id`,
      [w.h],
    );
    await w.as(C, `select public.save_recipe($1)`, [
      {
        ...w.recipe,
        household_id: w.hc,
        equipment_status: 'defined',
        methods: [{ utensils: [{ custom: u.id }] }],
      },
    ]);
  },
  'outsider ticks equipment of another household': (w) =>
    w.as(
      C,
      `insert into public.household_utensil_availability (household_id, utensil_def_id) values ($1,'oven')`,
      [w.h],
    ),
  'member edits someone else cook log': async (w) => {
    await w.as(
      A,
      `insert into public.recipe_cook_logs (recipe_id, household_id, total_minutes) values ($1,$2,30)`,
      [w.id, w.h],
    );
    const r = await w.as(B, `update public.recipe_cook_logs set total_minutes = 5`);
    if (!r.affectedRows) throw new Error('0 rows');
  },
  'member deletes someone else cook log': async (w) => {
    await w.as(
      A,
      `insert into public.recipe_cook_logs (recipe_id, household_id, total_minutes) values ($1,$2,30)`,
      [w.id, w.h],
    );
    const r = await w.as(B, `delete from public.recipe_cook_logs`);
    if (!r.affectedRows) throw new Error('0 rows');
  },
  'cook log on behalf of another user': (w) =>
    w.as(
      B,
      `insert into public.recipe_cook_logs (recipe_id, household_id, user_id) values ($1,$2,'${A}')`,
      [w.id, w.h],
    ),
  'defined equipment without methods': (w) =>
    w.as(A, `select public.save_recipe($1)`, [{ ...w.recipe, equipment_status: 'defined', methods: [] }]),
  'after transfer, old owner creates a tag': async (w) => {
    await w.as(A, `select public.transfer_household_ownership($1, $2)`, [w.h, B]);
    await w.as(A, `insert into public.household_tags (household_id, name) values ($1,'Cumple')`, [w.h]);
  },
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

eq('global catalogs visible to a member', (await one(as, B, `select
  (select count(*)::int from public.category_definitions) c,
  (select count(*)::int from public.tag_definitions) t,
  (select count(*)::int from public.utensil_definitions) u`)), { c: 17, t: 15, u: 36 });

const cat = await one(
  as,
  A,
  `insert into public.recipe_categories (household_id, name, icon, color) values ($1,'Tuppers','box','teal') returning id`,
  [h],
);
const tag = await one(
  as,
  A,
  `insert into public.household_tags (household_id, name) values ($1,'Cumpleaños') returning id`,
  [h],
);
const ute = await one(
  as,
  A,
  `insert into public.household_utensils (household_id, name) values ($1,'Máquina de pan') returning id`,
  [h],
);
await as(A, `insert into public.household_hidden_items (household_id, kind, item_id) values ($1,'category','drinks')`, [h]);
eq('owner custom items visible to member', await one(as, B, `select
  (select count(*)::int from public.recipe_categories) c,
  (select count(*)::int from public.household_tags) t,
  (select count(*)::int from public.household_utensils) u,
  (select count(*)::int from public.household_hidden_items) hidden`), { c: 1, t: 1, u: 1, hidden: 1 });
eq('outsider sees no custom items', await one(as, C, `select
  (select count(*)::int from public.recipe_categories) c,
  (select count(*)::int from public.household_tags) t,
  (select count(*)::int from public.household_utensils) u`), { c: 0, t: 0, u: 0 });

// A member saves a recipe using global + custom items, with two alternative methods.
await as(B, `select public.save_recipe($1)`, [
  {
    ...recipe,
    id,
    categories: [{ def: 'vegetables' }, { custom: cat.id }, { def: 'vegetables' }],
    tag_links: [{ def: 'vegan' }, { custom: tag.id }],
    equipment_status: 'defined',
    methods: [
      { label: 'Microondas', utensils: [{ def: 'microwave' }, { def: 'silicone_steam_case' }] },
      { utensils: [{ def: 'pot' }, { def: 'steamer_basket' }, { custom: ute.id }] },
    ],
  },
]);
eq('member saved links atomically', await one(as, B, `select
  (select count(*)::int from public.recipe_category_links) cats,
  (select count(*)::int from public.recipe_tag_links) tags,
  (select count(*)::int from public.recipe_methods) methods,
  (select count(*)::int from public.recipe_method_utensils) utensils,
  (select equipment_status from public.recipes where id = '${id}') status`),
  { cats: 2, tags: 2, methods: 2, utensils: 5, status: 'defined' });

// Hiding a global category keeps the recipe link.
await as(A, `insert into public.household_hidden_items (household_id, kind, item_id) values ($1,'category','vegetables')`, [h]);
eq('hidden category keeps its links', await one(as, B,
  `select count(*)::int n from public.recipe_category_links where category_def_id = 'vegetables'`), { n: 1 });

// v1 payload (no new keys) keeps tags/methods and still accepts category_ids.
await as(A, `select public.save_recipe($1)`, [{ ...recipe, id, category_ids: [cat.id] }]);
eq('v1 payload is backward compatible', await one(as, A, `select
  (select count(*)::int from public.recipe_category_links) cats,
  (select count(*)::int from public.recipe_tag_links) tags,
  (select count(*)::int from public.recipe_methods) methods`), { cats: 1, tags: 2, methods: 2 });

// Explicit "needs no equipment" clears the methods.
await as(B, `select public.save_recipe($1)`, [{ ...recipe, id, equipment_status: 'none', methods: [] }]);
eq('status none clears methods', await one(as, B, `select
  (select count(*)::int from public.recipe_methods) methods,
  (select equipment_status from public.recipes) status`), { methods: 0, status: 'none' });

// Equipment availability is per household and any member can tick it.
await as(B, `insert into public.household_utensil_availability (household_id, utensil_def_id) values ($1,'oven')`, [h]);
await as(B, `insert into public.household_utensil_availability (household_id, household_utensil_id) values ($1,$2)`, [h, ute.id]);
await as(B, `insert into public.household_kitchen (household_id) values ($1) on conflict do nothing`, [h]);
await as(C, `insert into public.household_utensil_availability (household_id, utensil_def_id) values ($1,'microwave')`, [w.hc]);
eq('availability is isolated per household', {
  a: (await one(as, A, `select count(*)::int n from public.household_utensil_availability`)).n,
  c: (await one(as, C, `select count(*)::int n from public.household_utensil_availability`)).n,
}, { a: 2, c: 1 });
await as(B, `delete from public.household_utensil_availability where utensil_def_id = 'oven'`);
eq('member unticks equipment', (await one(as, A, `select count(*)::int n from public.household_utensil_availability`)).n, 1);

// Cooking history: shared reading, own writing.
await as(A, `insert into public.recipe_cook_logs (recipe_id, household_id, total_minutes, servings) values ($1,$2,40,4)`, [id, h]);
const log = await one(as, B, `insert into public.recipe_cook_logs (recipe_id, household_id, total_minutes, active_minutes, notes) values ($1,$2,35,10,'ok') returning id, user_id = '${B}' as mine`, [id, h]);
eq('cook log belongs to its author', log.mine, true);
await as(B, `update public.recipe_cook_logs set total_minutes = 33 where id = $1`, [log.id]);
eq('household reads every cook log', (await one(as, A, `select count(*)::int n, sum(total_minutes)::int s from public.recipe_cook_logs`)), { n: 2, s: 73 });
eq('outsider reads no cook logs', (await one(as, C, `select count(*)::int n from public.recipe_cook_logs`)).n, 0);
eq('original recipe times untouched', (await one(as, A, `select active_minutes, total_minutes from public.recipes`)), { active_minutes: null, total_minutes: null });
await as(B, `delete from public.recipe_cook_logs where id = $1`, [log.id]);
eq('author deletes own cook log', (await one(as, A, `select count(*)::int n from public.recipe_cook_logs`)).n, 1);

// Ownership transfer moves the management rights.
await as(A, `select public.transfer_household_ownership($1, $2)`, [h, B]);
await as(B, `insert into public.household_tags (household_id, name) values ($1,'Navidad')`, [h]);
await as(B, `delete from public.household_hidden_items where household_id = $1 and item_id = 'drinks'`, [h]);
const aDelete = await as(A, `delete from public.household_tags where name = 'Navidad'`);
eq('new owner manages, old owner cannot', { aDeleted: aDelete.affectedRows, tags: (await one(as, B, `select count(*)::int n from public.household_tags`)).n }, { aDeleted: 0, tags: 2 });

// --- Legacy data migration ----------------------------------------------------------------------
const H = '11111111-1111-4111-8111-111111111111';
const R = '22222222-2222-4222-8222-222222222222';
const legacy = await setup({
  before: {
    file: CATALOGS,
    run: async (db) => {
      await db.exec(`
        insert into auth.users (id, raw_user_meta_data) values ('${A}','{"display_name":"A"}');
        insert into public.households (id, name, created_by) values ('${H}','Casa','${A}');
        insert into public.household_members (household_id, user_id, role) values ('${H}','${A}','owner');
        insert into public.recipes (id, household_id, created_by, title, base_servings, tags)
          values ('${R}','${H}','${A}','Lentejas', 4,
                  array['Vegana','vegan','Tupper',' tupper ','Rápida','Cumple']);
        insert into public.recipe_categories (id, household_id, name) values
          ('33333333-3333-4333-8333-333333333333','${H}','Legumbres'),
          ('44444444-4444-4444-8444-444444444444','${H}','De la abuela');
        insert into public.recipe_category_links (recipe_id, category_id, household_id) values
          ('${R}','33333333-3333-4333-8333-333333333333','${H}'),
          ('${R}','44444444-4444-4444-8444-444444444444','${H}');
      `);
    },
  },
});
eq('legacy tags migrated without loss', await one(legacy.as, A, `select
  (select array_agg(tag_def_id order by tag_def_id) from public.recipe_tag_links where tag_def_id is not null) defs,
  (select array_agg(name order by name) from public.household_tags) customs,
  (select count(*)::int from public.recipe_tag_links where household_tag_id is not null) custom_links,
  (select cardinality(tags) from public.recipes where id = '${R}') legacy_kept`),
  { defs: ['vegan'], customs: ['Cumple', 'Tupper'], custom_links: 2, legacy_kept: 6 });
eq('legacy categories kept (global match relinked)', await one(legacy.as, A, `select
  (select array_agg(coalesce(category_def_id, 'custom') order by 1) from public.recipe_category_links) links,
  (select array_agg(name) from public.recipe_categories) customs`),
  { links: ['custom', 'legumes'], customs: ['De la abuela'] });

if (failures) {
  console.error(`${failures} catalog check(s) failed`);
  process.exit(1);
}
console.log('db:verify catalogs OK');
