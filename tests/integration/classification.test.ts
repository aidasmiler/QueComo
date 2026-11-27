/**
 * Smart classification storage against the TEST Supabase project
 * (supabase/migrations/20261127180000_recipe_classification.sql): keywords are owner-only,
 * dismissed suggestions and optional utensils are saved per recipe and isolated per household.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { enabled, newUser, TEST_PROJECT, url, type Client } from './helpers';

type User = { client: Client; id: string };

const base = (household: string) => ({
  household_id: household,
  title: 'Crema IT',
  base_servings: 2,
  ingredients: [{ original_text: '2 calabacines', quantity: 2, unit: null, name: 'calabacines' }],
  steps: [{ body: 'Triturar.', timer_minutes: null }],
});

describe.skipIf(!enabled)('smart classification storage (test project)', () => {
  let owner: User;
  let member: User;
  let outsider: User;
  let household: string;
  let utensil: string;

  beforeAll(async () => {
    expect(url).toContain(TEST_PROJECT);
    [owner, member, outsider] = await Promise.all([
      newUser('kw-own'),
      newUser('kw-mem'),
      newUser('kw-out'),
    ]);
    household = (await owner.client.rpc('create_household', { p_name: 'Cocina K' })).data!;
    await outsider.client.rpc('create_household', { p_name: 'Cocina O' });
    const invitation = await owner.client.rpc('create_household_invitation', {
      p_household_id: household,
    });
    await member.client.rpc('accept_household_invitation', { p_token: invitation.data![0]!.token });
    utensil = (
      await owner.client
        .from('household_utensils')
        .insert({ household_id: household, name: 'Mambo IT', keywords: ['robot', 'cecotec'] })
        .select('id')
        .single()
    ).data!.id;
  }, 30_000);

  it('owners write keywords, members read them but cannot change them', async () => {
    const read = await member.client
      .from('household_utensils')
      .select('keywords')
      .eq('id', utensil);
    expect(read.data?.[0]?.keywords).toEqual(['robot', 'cecotec']);
    const change = await member.client
      .from('household_utensils')
      .update({ keywords: ['hack'] })
      .eq('id', utensil)
      .select('id');
    expect(change.data ?? []).toHaveLength(0);
    const insert = await member.client
      .from('household_tags')
      .insert({ household_id: household, name: 'Nope IT', keywords: ['x'] });
    expect(insert.error).not.toBeNull();
    const outside = await outsider.client.from('household_utensils').select('id').eq('id', utensil);
    expect(outside.data ?? []).toHaveLength(0);
  });

  it('saves dismissed suggestions and optional utensils with the recipe', async () => {
    const saved = await member.client.rpc('save_recipe', {
      p_recipe: {
        ...base(household),
        dismissed_suggestions: ['category:def:soups', 'utensil:def:oven'],
        optional_utensils: [{ def: 'grater' }, { custom: utensil }],
      } as never,
    });
    expect(saved.error).toBeNull();
    const id = saved.data!;
    const recipe = await owner.client
      .from('recipes')
      .select(
        'dismissed_suggestions, recipe_optional_utensils(utensil_def_id, household_utensil_id)',
      )
      .eq('id', id)
      .single();
    expect(recipe.data?.dismissed_suggestions.slice().sort()).toEqual([
      'category:def:soups',
      'utensil:def:oven',
    ]);
    expect(recipe.data?.recipe_optional_utensils).toHaveLength(2);

    // Older clients (no new keys) keep both.
    await owner.client.rpc('save_recipe', {
      p_recipe: { ...base(household), id, title: 'v2' } as never,
    });
    const again = await owner.client
      .from('recipes')
      .select('dismissed_suggestions, recipe_optional_utensils(id)')
      .eq('id', id)
      .single();
    expect(again.data?.dismissed_suggestions).toHaveLength(2);
    expect(again.data?.recipe_optional_utensils).toHaveLength(2);
    const outside = await outsider.client.from('recipe_optional_utensils').select('id');
    expect(outside.data ?? []).toHaveLength(0);
  });

  it('rejects malformed suggestions and foreign custom utensils', async () => {
    const bad = await member.client.rpc('save_recipe', {
      p_recipe: { ...base(household), dismissed_suggestions: ['pasta'] } as never,
    });
    expect(bad.error?.message).toContain('QC_RECIPE_SUGGESTIONS');
    const outsiderHousehold = (
      await outsider.client.from('household_members').select('household_id')
    ).data![0]!.household_id;
    const foreign = await outsider.client.rpc('save_recipe', {
      p_recipe: { ...base(outsiderHousehold), optional_utensils: [{ custom: utensil }] } as never,
    });
    expect(foreign.error).not.toBeNull();
  });
});
