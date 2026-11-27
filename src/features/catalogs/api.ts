import { supabase } from '@/lib/supabase/client';
import { AppError, toAppError, unwrap } from '@/lib/supabase/errors';
import type { Database } from '@/lib/supabase/database.types';
import { rowKey, type ItemKey } from '@/domain/recipes/catalog';

type Tables = Database['public']['Tables'];
export type CategoryDefinition = Tables['category_definitions']['Row'];
export type TagDefinition = Tables['tag_definitions']['Row'];
export type UtensilDefinition = Tables['utensil_definitions']['Row'];
export type CustomCategory = Tables['recipe_categories']['Row'];
export type CustomTag = Tables['household_tags']['Row'];
export type CustomUtensil = Tables['household_utensils']['Row'];
export type CatalogKind = 'category' | 'tag' | 'utensil';
export type CookLog = Tables['recipe_cook_logs']['Row'];
export type CookLogInput = Tables['recipe_cook_logs']['Insert'];
export type CookLogPatch = Tables['recipe_cook_logs']['Update'];

export interface Definitions {
  categories: CategoryDefinition[];
  tags: TagDefinition[];
  utensils: UtensilDefinition[];
}

export interface HouseholdCatalog {
  categories: CustomCategory[];
  tags: CustomTag[];
  utensils: CustomUtensil[];
  hidden: { kind: CatalogKind; item_id: string }[];
}

export interface KitchenState {
  configured: boolean;
  available: Set<ItemKey>;
}

/** Global catalogs: the same for everybody and read-only. */
export async function fetchDefinitions(): Promise<Definitions> {
  const [categories, tags, utensils] = await Promise.all([
    supabase.from('category_definitions').select('*').order('position'),
    supabase.from('tag_definitions').select('*').order('position'),
    supabase.from('utensil_definitions').select('*').order('position'),
  ]);
  return { categories: unwrap(categories), tags: unwrap(tags), utensils: unwrap(utensils) };
}

export async function fetchHouseholdCatalog(householdId: string): Promise<HouseholdCatalog> {
  const [categories, tags, utensils, hidden] = await Promise.all([
    supabase.from('recipe_categories').select('*').eq('household_id', householdId).order('name'),
    supabase.from('household_tags').select('*').eq('household_id', householdId).order('name'),
    supabase.from('household_utensils').select('*').eq('household_id', householdId).order('name'),
    supabase.from('household_hidden_items').select('kind, item_id').eq('household_id', householdId),
  ]);
  return {
    categories: unwrap(categories),
    tags: unwrap(tags),
    utensils: unwrap(utensils),
    hidden: unwrap(hidden) as HouseholdCatalog['hidden'],
  };
}

/** Unique-index violations between custom items get the same message as the global check. */
function catalogError(error: unknown): never {
  const raw = error as { code?: string } | null;
  if (raw?.code === '23505') throw new AppError('server', 'QC_CATALOG_DUPLICATE', 'duplicate');
  throw toAppError(error);
}

const CUSTOM_TABLE = {
  category: 'recipe_categories',
  tag: 'household_tags',
  utensil: 'household_utensils',
} as const;

export interface CustomFields {
  name: string;
  icon?: string | null;
  color?: string | null;
}

export async function createCustom(
  kind: CatalogKind,
  householdId: string,
  fields: CustomFields,
): Promise<{ id: string }> {
  const name = fields.name.trim();
  const result =
    kind === 'category'
      ? await supabase
          .from('recipe_categories')
          .insert({
            household_id: householdId,
            name,
            icon: fields.icon ?? null,
            color: fields.color ?? null,
          })
          .select('id')
          .single()
      : await supabase
          .from(CUSTOM_TABLE[kind])
          .insert({ household_id: householdId, name })
          .select('id')
          .single();
  if (result.error) catalogError(result.error);
  return result.data as { id: string };
}

export async function updateCustom(kind: CatalogKind, id: string, fields: CustomFields) {
  const name = fields.name.trim();
  const result =
    kind === 'category'
      ? await supabase
          .from('recipe_categories')
          .update({ name, icon: fields.icon ?? null, color: fields.color ?? null })
          .eq('id', id)
          .select('id')
      : await supabase.from(CUSTOM_TABLE[kind]).update({ name }).eq('id', id).select('id');
  if (result.error) catalogError(result.error);
  // RLS hides the row from non-owners: no error, nothing updated.
  if (!result.data?.length) throw new AppError('server', 'QC_NOT_OWNER', 'not owner');
}

export async function deleteCustom(kind: CatalogKind, id: string) {
  const deleted = unwrap(
    await supabase.from(CUSTOM_TABLE[kind]).delete().eq('id', id).select('id'),
  );
  if (!deleted.length) throw new AppError('server', 'QC_NOT_OWNER', 'not owner');
}

export async function setHidden(
  householdId: string,
  kind: CatalogKind,
  itemId: string,
  hidden: boolean,
) {
  if (hidden) {
    const { error } = await supabase
      .from('household_hidden_items')
      .insert({ household_id: householdId, kind, item_id: itemId });
    if (error && (error as { code?: string }).code !== '23505') throw toAppError(error);
    return;
  }
  unwrap(
    await supabase
      .from('household_hidden_items')
      .delete()
      .eq('household_id', householdId)
      .eq('kind', kind)
      .eq('item_id', itemId),
  );
}

export async function fetchKitchen(householdId: string): Promise<KitchenState> {
  const [rows, kitchen] = await Promise.all([
    supabase
      .from('household_utensil_availability')
      .select('utensil_def_id, household_utensil_id')
      .eq('household_id', householdId),
    supabase
      .from('household_kitchen')
      .select('household_id')
      .eq('household_id', householdId)
      .maybeSingle(),
  ]);
  return {
    configured: unwrap(kitchen) !== null,
    available: new Set(
      unwrap(rows).map((row) => rowKey(row.utensil_def_id, row.household_utensil_id)),
    ),
  };
}

function splitKey(key: ItemKey): {
  utensil_def_id: string | null;
  household_utensil_id: string | null;
} {
  return key.startsWith('def:')
    ? { utensil_def_id: key.slice(4), household_utensil_id: null }
    : { utensil_def_id: null, household_utensil_id: key.slice(7) };
}

/** Marks the kitchen as configured (idempotent): from then on, availability filters apply. */
export async function markKitchenConfigured(householdId: string) {
  const { error } = await supabase.from('household_kitchen').insert({ household_id: householdId });
  if (error && (error as { code?: string }).code !== '23505') throw toAppError(error);
}

export async function setUtensilsAvailable(
  householdId: string,
  keys: ItemKey[],
  available: boolean,
) {
  if (available) {
    const rows = keys.map((key) => ({ household_id: householdId, ...splitKey(key) }));
    // One by one so an already ticked utensil (unique violation) does not abort the rest.
    for (const row of rows) {
      const { error } = await supabase.from('household_utensil_availability').insert(row);
      if (error && (error as { code?: string }).code !== '23505') throw toAppError(error);
    }
  } else {
    const defs = keys.filter((key) => key.startsWith('def:')).map((key) => key.slice(4));
    const customs = keys.filter((key) => key.startsWith('custom:')).map((key) => key.slice(7));
    if (defs.length) {
      unwrap(
        await supabase
          .from('household_utensil_availability')
          .delete()
          .eq('household_id', householdId)
          .in('utensil_def_id', defs),
      );
    }
    if (customs.length) {
      unwrap(
        await supabase
          .from('household_utensil_availability')
          .delete()
          .eq('household_id', householdId)
          .in('household_utensil_id', customs),
      );
    }
  }
  await markKitchenConfigured(householdId);
}

/** Minimal columns of every cook log of the household, for estimates in lists. */
export async function fetchHouseholdCookTimes(householdId: string) {
  return unwrap(
    await supabase
      .from('recipe_cook_logs')
      .select('recipe_id, user_id, cooked_on, total_minutes, active_minutes')
      .eq('household_id', householdId),
  );
}

export async function fetchCookLogs(recipeId: string): Promise<CookLog[]> {
  return unwrap(
    await supabase
      .from('recipe_cook_logs')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('cooked_on', { ascending: false })
      .order('created_at', { ascending: false }),
  );
}

export async function createCookLog(input: CookLogInput) {
  unwrap(await supabase.from('recipe_cook_logs').insert(input));
}

export async function updateCookLog(id: string, patch: CookLogPatch) {
  unwrap(await supabase.from('recipe_cook_logs').update(patch).eq('id', id));
}

export async function deleteCookLog(id: string) {
  unwrap(await supabase.from('recipe_cook_logs').delete().eq('id', id));
}
