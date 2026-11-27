import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/features/auth/auth-context';
import { useActiveHousehold } from '@/features/households/active-household';
import { queryKeys } from '@/lib/query/keys';
import * as api from './api';

function useHouseholdId() {
  const { active } = useActiveHousehold();
  if (!active) throw new Error('Recipes require an active household');
  return active.id;
}

export function useRecipes() {
  const householdId = useHouseholdId();
  return useQuery({
    queryKey: queryKeys.recipes(householdId),
    queryFn: () => api.fetchRecipes(householdId),
  });
}

export function useRecipe(recipeId: string) {
  return useQuery({
    queryKey: queryKeys.recipe(recipeId),
    queryFn: () => api.fetchRecipe(recipeId),
  });
}

export function useRecipeCategories() {
  const householdId = useHouseholdId();
  return useQuery({
    queryKey: queryKeys.recipeCategories(householdId),
    queryFn: () => api.fetchCategories(householdId),
  });
}

/** Favourites and ratings of the current user for the given recipes, as a map by recipe id. */
export function useRecipeUserState(recipeIds: string[]) {
  const user = useCurrentUser();
  const householdId = useHouseholdId();
  return useQuery({
    queryKey: [...queryKeys.recipeUserState(user.id, householdId), recipeIds.join(',')],
    queryFn: async () => {
      const rows = await api.fetchUserState(recipeIds);
      return new Map(rows.map((row) => [row.recipe_id, row]));
    },
    enabled: recipeIds.length > 0,
  });
}

function useInvalidateRecipes() {
  const qc = useQueryClient();
  const householdId = useHouseholdId();
  return async (recipeId?: string) => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.recipes(householdId) }),
      recipeId ? qc.invalidateQueries({ queryKey: queryKeys.recipe(recipeId) }) : null,
    ]);
  };
}

export function useSaveRecipe() {
  const invalidate = useInvalidateRecipes();
  return useMutation({
    mutationFn: api.saveRecipe,
    onSuccess: (id) => invalidate(id),
  });
}

export function useSetArchived(recipeId: string) {
  const invalidate = useInvalidateRecipes();
  return useMutation({
    mutationFn: (archived: boolean) => api.setArchived(recipeId, archived),
    onSuccess: () => invalidate(recipeId),
  });
}

export function useDeleteRecipe() {
  const qc = useQueryClient();
  const invalidate = useInvalidateRecipes();
  return useMutation({
    mutationFn: api.deleteRecipe,
    onSuccess: async (_, recipe) => {
      qc.removeQueries({ queryKey: queryKeys.recipe(recipe.id) });
      await invalidate();
    },
  });
}

export function useUploadPhoto() {
  const invalidate = useInvalidateRecipes();
  return useMutation({
    mutationFn: ({
      recipe,
      file,
    }: {
      recipe: Pick<api.Recipe, 'id' | 'household_id' | 'photo_path'>;
      file: Blob;
    }) => api.uploadPhoto(recipe, file),
    onSuccess: (_, { recipe }) => invalidate(recipe.id),
  });
}

export function useRemovePhoto() {
  const invalidate = useInvalidateRecipes();
  return useMutation({
    mutationFn: api.removePhoto,
    onSuccess: (_, recipe) => invalidate(recipe.id),
  });
}

export function usePhotoUrl(path: string | null) {
  return useQuery({
    queryKey: ['recipe-photo', path],
    queryFn: () => (path ? api.signedPhotoUrl(path) : null),
    enabled: Boolean(path),
    staleTime: 50 * 60 * 1000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  const householdId = useHouseholdId();
  return useMutation({
    mutationFn: (name: string) => api.createCategory(householdId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.recipeCategories(householdId) }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  const householdId = useHouseholdId();
  return useMutation({
    mutationFn: api.deleteCategory,
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.recipeCategories(householdId) }),
        qc.invalidateQueries({ queryKey: queryKeys.recipes(householdId) }),
      ]),
  });
}

export function useUpdateUserState() {
  const qc = useQueryClient();
  const user = useCurrentUser();
  const householdId = useHouseholdId();
  return useMutation({
    mutationFn: ({
      recipeId,
      patch,
    }: {
      recipeId: string;
      patch: { favorite?: boolean; rating?: number | null };
    }) => api.upsertUserState(recipeId, patch),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.recipeUserState(user.id, householdId) }),
  });
}
