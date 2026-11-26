import { supabase } from '@/lib/supabase/client';
import { unwrap } from '@/lib/supabase/errors';
import type { Database } from '@/lib/supabase/database.types';

type Tables = Database['public']['Tables'];
export type Recipe = Tables['recipes']['Row'];
export type RecipeIngredient = Tables['recipe_ingredients']['Row'];
export type RecipeStep = Tables['recipe_steps']['Row'];
export type RecipeCategory = Tables['recipe_categories']['Row'];
export type RecipeUserState = Tables['recipe_user_state']['Row'];
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface RecipeSummary extends Recipe {
  categoryIds: string[];
}

export interface RecipeDetail extends RecipeSummary {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

/** Shape sent to the save_recipe RPC (see supabase/migrations/20261127000000_recipes.sql). */
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
  tags: string[];
  source_url: string | null;
  source_author: string | null;
  notes: string | null;
  storage_notes: string | null;
  freezing_notes: string | null;
  reheating_notes: string | null;
  category_ids: string[];
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

export async function fetchRecipes(householdId: string): Promise<RecipeSummary[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*, recipe_category_links(category_id)')
    .eq('household_id', householdId)
    .order('updated_at', { ascending: false });
  return unwrap({ data: data as RecipeRow[] | null, error }).map(toSummary);
}

type RecipeRow = Recipe & {
  recipe_category_links: { category_id: string }[];
  recipe_ingredients?: RecipeIngredient[];
  recipe_steps?: RecipeStep[];
};

function toSummary({ recipe_category_links: links, ...recipe }: RecipeRow): RecipeSummary {
  const { recipe_ingredients: _i, recipe_steps: _s, ...rest } = recipe;
  void _i;
  void _s;
  return { ...rest, categoryIds: links.map((l) => l.category_id) };
}

export async function fetchRecipe(recipeId: string): Promise<RecipeDetail | null> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*, recipe_category_links(category_id), recipe_ingredients(*), recipe_steps(*)')
    .eq('id', recipeId)
    .maybeSingle();
  const row = unwrap({ data: data as RecipeRow | null, error });
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

export async function fetchCategories(householdId: string): Promise<RecipeCategory[]> {
  return unwrap(
    await supabase
      .from('recipe_categories')
      .select('*')
      .eq('household_id', householdId)
      .order('name'),
  );
}

export async function createCategory(householdId: string, name: string): Promise<RecipeCategory> {
  return unwrap(
    await supabase
      .from('recipe_categories')
      .insert({ household_id: householdId, name: name.trim() })
      .select('*')
      .single(),
  );
}

export async function deleteCategory(categoryId: string) {
  unwrap(await supabase.from('recipe_categories').delete().eq('id', categoryId));
}

export async function fetchUserState(recipeIds: string[]): Promise<RecipeUserState[]> {
  if (!recipeIds.length) return [];
  return unwrap(await supabase.from('recipe_user_state').select('*').in('recipe_id', recipeIds));
}

export async function upsertUserState(
  recipeId: string,
  patch: { favorite?: boolean; rating?: number | null },
) {
  unwrap(
    await supabase
      .from('recipe_user_state')
      .upsert({ recipe_id: recipeId, ...patch }, { onConflict: 'user_id,recipe_id' }),
  );
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
