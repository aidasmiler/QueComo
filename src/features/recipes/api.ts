import { supabase } from '@/lib/supabase/client';
import { unwrap } from '@/lib/supabase/errors';
import type { Database } from '@/lib/supabase/database.types';
import { rowKey, type ItemKey, type ItemRef } from '@/domain/recipes/catalog';
import type { EquipmentStatus, RecipeEquipment } from '@/domain/recipes/equipment';

type Tables = Database['public']['Tables'];
export type Recipe = Tables['recipes']['Row'];
export type RecipeIngredient = Tables['recipe_ingredients']['Row'];
export type RecipeStep = Tables['recipe_steps']['Row'];
export type RecipeUserState = Tables['recipe_user_state']['Row'];
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface RecipeSummary extends Recipe {
  categoryKeys: ItemKey[];
  tagKeys: ItemKey[];
  equipment: RecipeEquipment;
  /** Utensils marked optional: shown, never used to decide whether it can be made. */
  optionalUtensils: ItemKey[];
}

export interface RecipeDetail extends RecipeSummary {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

/**
 * Shape sent to the save_recipe RPC (supabase/migrations/20261127120000_recipe_catalogs.sql).
 * `tags` (legacy free text) is left out so the stored value is kept untouched.
 */
export interface RecipeInput {
  id?: string;
  household_id: string;
  title: string;
  description: string | null;
  base_servings: number;
  difficulty: Difficulty | null;
  active_minutes: number | null;
  passive_minutes: number | null;
  total_minutes: number | null;
  source_url: string | null;
  source_author: string | null;
  notes: string | null;
  storage_notes: string | null;
  freezing_notes: string | null;
  reheating_notes: string | null;
  categories: ItemRef[];
  tag_links: ItemRef[];
  equipment_status: EquipmentStatus;
  methods: { label: string | null; utensils: ItemRef[] }[];
  optional_utensils: ItemRef[];
  /** Suggestion ids the person rejected (`category:def:pasta`...). */
  dismissed_suggestions: string[];
  ingredients: {
    original_text: string;
    quantity: number | null;
    unit: string | null;
    name: string;
    scalable: boolean;
    optional: boolean;
  }[];
  steps: { body: string; timer_minutes: number | null }[];
}

const PHOTO_BUCKET = 'recipe-photos';

const LINKS =
  'recipe_category_links(category_id, category_def_id), recipe_tag_links(tag_def_id, household_tag_id), recipe_methods(position, label, recipe_method_utensils(utensil_def_id, household_utensil_id)), recipe_optional_utensils(utensil_def_id, household_utensil_id)';

export async function fetchRecipes(householdId: string): Promise<RecipeSummary[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select(`*, ${LINKS}`)
    .eq('household_id', householdId)
    .order('updated_at', { ascending: false });
  return unwrap({ data: data as unknown as RecipeRow[] | null, error }).map(toSummary);
}

type RecipeRow = Recipe & {
  recipe_category_links: { category_id: string | null; category_def_id: string | null }[];
  recipe_tag_links: { tag_def_id: string | null; household_tag_id: string | null }[];
  recipe_methods: {
    position: number;
    label: string | null;
    recipe_method_utensils: {
      utensil_def_id: string | null;
      household_utensil_id: string | null;
    }[];
  }[];
  recipe_optional_utensils: {
    utensil_def_id: string | null;
    household_utensil_id: string | null;
  }[];
  recipe_ingredients?: RecipeIngredient[];
  recipe_steps?: RecipeStep[];
};

function toSummary(row: RecipeRow): RecipeSummary {
  const {
    recipe_category_links: categories,
    recipe_tag_links: tags,
    recipe_methods: methods,
    recipe_optional_utensils: optional,
    recipe_ingredients: _i,
    recipe_steps: _s,
    ...rest
  } = row;
  void _i;
  void _s;
  return {
    ...rest,
    categoryKeys: categories.map((l) => rowKey(l.category_def_id, l.category_id)),
    tagKeys: tags.map((l) => rowKey(l.tag_def_id, l.household_tag_id)),
    optionalUtensils: (optional ?? []).map((u) => rowKey(u.utensil_def_id, u.household_utensil_id)),
    equipment: {
      status: rest.equipment_status as EquipmentStatus,
      methods: [...methods]
        .sort((a, b) => a.position - b.position)
        .map((m) => ({
          label: m.label,
          utensils: m.recipe_method_utensils.map((u) =>
            rowKey(u.utensil_def_id, u.household_utensil_id),
          ),
        })),
    },
  };
}

export async function fetchRecipe(recipeId: string): Promise<RecipeDetail | null> {
  const { data, error } = await supabase
    .from('recipes')
    .select(`*, ${LINKS}, recipe_ingredients(*), recipe_steps(*)`)
    .eq('id', recipeId)
    .maybeSingle();
  const row = unwrap({ data: data as unknown as RecipeRow | null, error });
  if (!row) return null;
  return {
    ...toSummary(row),
    ingredients: [...(row.recipe_ingredients ?? [])].sort((a, b) => a.position - b.position),
    steps: [...(row.recipe_steps ?? [])].sort((a, b) => a.position - b.position),
  };
}

export async function saveRecipe(input: RecipeInput): Promise<string> {
  return unwrap(await supabase.rpc('save_recipe', { p_recipe: input as never }));
}

export async function setArchived(recipeId: string, archived: boolean) {
  unwrap(
    await supabase
      .from('recipes')
      .update({ archived_at: archived ? new Date().toISOString() : null })
      .eq('id', recipeId),
  );
}

export async function deleteRecipe(recipe: Pick<Recipe, 'id' | 'photo_path'>) {
  unwrap(await supabase.from('recipes').delete().eq('id', recipe.id));
  if (recipe.photo_path) await supabase.storage.from(PHOTO_BUCKET).remove([recipe.photo_path]);
}

export async function fetchUserState(recipeIds: string[]): Promise<RecipeUserState[]> {
  if (!recipeIds.length) return [];
  return unwrap(await supabase.from('recipe_user_state').select('*').in('recipe_id', recipeIds));
}

export async function upsertUserState(
  recipeId: string,
  patch: { favorite?: boolean; rating?: number | null },
) {
  // Not an upsert: PostgREST's ON CONFLICT DO UPDATE would also set recipe_id, which is not an
  // updatable column (only favorite and rating are granted). Update first, insert if missing.
  const updated = unwrap(
    await supabase
      .from('recipe_user_state')
      .update(patch)
      .eq('recipe_id', recipeId)
      .select('recipe_id'),
  );
  if (updated.length) return;
  const { error } = await supabase
    .from('recipe_user_state')
    .insert({ recipe_id: recipeId, ...patch });
  // 23505: a parallel request created the row first, so apply the change to it.
  if (error?.code === '23505') {
    unwrap(await supabase.from('recipe_user_state').update(patch).eq('recipe_id', recipeId));
    return;
  }
  unwrap({ data: null, error });
}

/** Uploads a (pre-resized) photo and stores its path on the recipe. Returns the new path. */
export async function uploadPhoto(
  recipe: Pick<Recipe, 'id' | 'household_id' | 'photo_path'>,
  file: Blob,
) {
  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${recipe.household_id}/${recipe.id}/${crypto.randomUUID()}.${extension}`;
  unwrap(
    await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, file, { contentType: file.type, cacheControl: '31536000', upsert: false }),
  );
  unwrap(await supabase.from('recipes').update({ photo_path: path }).eq('id', recipe.id));
  if (recipe.photo_path) await supabase.storage.from(PHOTO_BUCKET).remove([recipe.photo_path]);
  return path;
}

export async function removePhoto(recipe: Pick<Recipe, 'id' | 'photo_path'>) {
  unwrap(await supabase.from('recipes').update({ photo_path: null }).eq('id', recipe.id));
  if (recipe.photo_path) await supabase.storage.from(PHOTO_BUCKET).remove([recipe.photo_path]);
}

/** Private bucket: photos are served through short-lived signed URLs. */
export async function signedPhotoUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, 60 * 60);
  return error ? null : data.signedUrl;
}
