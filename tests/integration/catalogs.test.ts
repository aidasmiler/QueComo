/**
 * Catalogue, equipment and cooking-history permissions against the TEST Supabase project.
 * Checks the database itself (RLS and RPCs), not the UI: members use but cannot manage.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { enabled, newUser, TEST_PROJECT, url, type Client } from './helpers';

type User = { client: Client; id: string };

const ingredient = { original_text: '1 huevo', quantity: 1, unit: null, name: 'huevo' };
const step = { body: 'Cocinar.', timer_minutes: null };

describe.skipIf(!enabled)('recipe catalogues RLS (test project)', () => {
  let owner: User;
  let member: User;
  let outsider: User;
  let household: string;
  let otherHousehold: string;
  let customTag: string;
  let customUtensil: string;
  let customCategory: string;

  beforeAll(async () => {
    expect(url).toContain(TEST_PROJECT);
    [owner, member, outsider] = await Promise.all([newUser('own'), newUser('mem'), newUser('out')]);
    household = (await owner.client.rpc('create_household', { p_name: 'Cocina A' })).data!;
    otherHousehold = (await outsider.client.rpc('create_household', { p_name: 'Cocina C' })).data!;
    const invitation = await owner.client.rpc('create_household_invitation', {
      p_household_id: household,
    });
    const token = invitation.data![0]!.token;
    expect(
      (await member.client.rpc('accept_household_invitation', { p_token: token })).error,
    ).toBeNull();
    customTag = (
      await owner.client
        .from('household_tags')
        .insert({ household_id: household, name: 'Tupper IT' })
        .select('id')
        .single()
    ).data!.id;
    customUtensil = (
      await owner.client
        .from('household_utensils')
        .insert({ household_id: household, name: 'Olla de barro IT' })
        .select('id')
        .single()
    ).data!.id;
    customCategory = (
      await owner.client
        .from('recipe_categories')
        .insert({ household_id: household, name: 'Panadería IT', icon: 'wheat', color: 'brown' })
        .select('id')
        .single()
    ).data!.id;
  }, 30_000);

  it('everyone signed in reads the global catalogues, nobody writes them', async () => {
    const [cats, tags, utensils] = await Promise.all([
      member.client.from('category_definitions').select('id'),
      member.client.from('tag_definitions').select('id'),
      member.client.from('utensil_definitions').select('id'),
    ]);
    expect(cats.data).toHaveLength(17);
    expect(tags.data).toHaveLength(15);
    expect(utensils.data).toHaveLength(36);
    const write = await owner.client
      .from('utensil_definitions')
      .delete()
      .eq('id', 'oven')
      .select('id');
    expect(write.error ?? (write.data?.length === 0 ? 'none' : null)).not.toBeNull();
  });

  it('members use but cannot manage custom items, even calling the API directly', async () => {
    const insert = await member.client
      .from('household_tags')
      .insert({ household_id: household, name: 'Nope' });
    expect(insert.error).not.toBeNull();
    const rename = await member.client
      .from('household_utensils')
      .update({ name: 'X' })
      .eq('id', customUtensil)
      .select('id');
    expect(rename.data ?? []).toHaveLength(0);
    const remove = await member.client
      .from('recipe_categories')
      .delete()
      .eq('id', customCategory)
      .select('id');
    expect(remove.data ?? []).toHaveLength(0);
    const hide = await member.client
      .from('household_hidden_items')
      .insert({ household_id: household, kind: 'tag', item_id: 'vegan' });
    expect(hide.error).not.toBeNull();
    const visible = await member.client
      .from('household_tags')
      .select('id')
      .eq('household_id', household);
    expect(visible.data).toHaveLength(1);
  });

  it('custom names cannot duplicate global ones', async () => {
    const dup = await owner.client
      .from('household_utensils')
      .insert({ household_id: household, name: 'horno' });
    expect(dup.error?.message).toContain('QC_CATALOG_DUPLICATE');
  });

  it('members save recipes with categories, tags and alternative methods', async () => {
    const { data: id, error } = await member.client.rpc('save_recipe', {
      p_recipe: {
        household_id: household,
        title: 'Salmón IT',
        base_servings: 2,
        ingredients: [ingredient],
        steps: [step],
        categories: [{ def: 'fish_seafood' }, { custom: customCategory }],
        tag_links: [{ def: 'high_protein' }, { custom: customTag }],
        equipment_status: 'defined',
        methods: [
          { label: 'Lékué', utensils: [{ def: 'silicone_steam_case' }, { def: 'microwave' }] },
          { label: 'Horno', utensils: [{ def: 'oven' }, { custom: customUtensil }] },
        ],
      },
    });
    expect(error).toBeNull();
    const methods = await owner.client
      .from('recipe_methods')
      .select('position')
      .eq('recipe_id', id!);
    expect(methods.data).toHaveLength(2);
    const legacy = await member.client.rpc('save_recipe', {
      p_recipe: {
        household_id: household,
        title: 'v1',
        base_servings: 1,
        ingredients: [ingredient],
        steps: [step],
        category_ids: [customCategory],
        tags: ['x'],
      },
    });
    expect(legacy.error).toBeNull();
  });

  it('outsiders cannot link custom items of another household', async () => {
    const { error } = await outsider.client.rpc('save_recipe', {
      p_recipe: {
        household_id: otherHousehold,
        title: 'X',
        base_servings: 1,
        ingredients: [ingredient],
        steps: [step],
        tag_links: [{ custom: customTag }],
      },
    });
    expect(error).not.toBeNull();
    const read = await outsider.client
      .from('household_utensil_availability')
      .select('id')
      .eq('household_id', household);
    expect(read.data ?? []).toHaveLength(0);
  });

  it('equipment is shared by members and isolated per household', async () => {
    expect(
      (
        await member.client
          .from('household_utensil_availability')
          .insert({ household_id: household, utensil_def_id: 'microwave' })
      ).error,
    ).toBeNull();
    expect(
      (await member.client.from('household_kitchen').insert({ household_id: household })).error,
    ).toBeNull();
    const seen = await owner.client
      .from('household_utensil_availability')
      .select('utensil_def_id')
      .eq('household_id', household);
    expect(seen.data?.map((r) => r.utensil_def_id)).toEqual(['microwave']);
    const foreign = await outsider.client
      .from('household_utensil_availability')
      .insert({ household_id: household, utensil_def_id: 'oven' });
    expect(foreign.error).not.toBeNull();
  });

  it('cook logs: household reads all, each person edits only their own', async () => {
    const recipe = (
      await owner.client.from('recipes').select('id').eq('title', 'Salmón IT').single()
    ).data!.id;
    const own = await owner.client
      .from('recipe_cook_logs')
      .insert({ recipe_id: recipe, household_id: household, total_minutes: 20 })
      .select('id')
      .single();
    expect(own.error).toBeNull();
    const edit = await member.client
      .from('recipe_cook_logs')
      .update({ total_minutes: 1 })
      .eq('id', own.data!.id)
      .select('id');
    expect(edit.data ?? []).toHaveLength(0);
    const read = await member.client.from('recipe_cook_logs').select('id').eq('recipe_id', recipe);
    expect(read.data).toHaveLength(1);
    const outsiderRead = await outsider.client
      .from('recipe_cook_logs')
      .select('id')
      .eq('recipe_id', recipe);
    expect(outsiderRead.data ?? []).toHaveLength(0);
  });

  it('transferring ownership moves the management rights', async () => {
    expect(
      (
        await owner.client.rpc('transfer_household_ownership', {
          p_household_id: household,
          p_new_owner: member.id,
        })
      ).error,
    ).toBeNull();
    const byNewOwner = await member.client
      .from('household_tags')
      .insert({ household_id: household, name: 'Nueva IT' });
    expect(byNewOwner.error).toBeNull();
    const byOldOwner = await owner.client
      .from('household_tags')
      .insert({ household_id: household, name: 'Vieja IT' });
    expect(byOldOwner.error).not.toBeNull();
  });
});
