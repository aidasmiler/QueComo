import { useMemo } from 'react';
import { autoTags, type AutoTag } from '@/domain/recipes/auto-tags';
import { evaluateEquipment, type EquipmentEvaluation } from '@/domain/recipes/equipment';
import { effectiveTimes, type CookLogTimes, type EffectiveTimes } from '@/domain/recipes/estimates';
import { useCurrentUser } from '@/features/auth/auth-context';
import type { KitchenState } from '@/features/catalogs/api';
import { useCookTimes, useKitchen } from '@/features/catalogs/hooks';
import type { RecipeSummary } from './api';
import { totalMinutes } from './format';

export interface RecipeInsight {
  evaluation: EquipmentEvaluation;
  times: EffectiveTimes;
  autoTags: AutoTag[];
}

const EMPTY_KITCHEN: KitchenState = { configured: false, available: new Set() };

export function computeInsight(
  recipe: RecipeSummary,
  kitchen: KitchenState,
  logs: readonly CookLogTimes[],
  userId: string,
): RecipeInsight {
  const times = effectiveTimes(
    { total: totalMinutes(recipe), active: recipe.active_minutes },
    logs,
    userId,
  );
  return {
    evaluation: evaluateEquipment(recipe.equipment, kitchen),
    times,
    autoTags: autoTags({
      totalMinutes: times.total.minutes,
      activeMinutes: times.active.minutes,
      difficulty: recipe.difficulty,
      equipment: recipe.equipment,
    }),
  };
}

/** Availability, effective times and automatic tags of each recipe for the active household. */
export function useRecipeInsights(recipes: RecipeSummary[] | undefined) {
  const user = useCurrentUser();
  const kitchen = useKitchen();
  const cookTimes = useCookTimes();
  const data = useMemo(() => {
    const byRecipe = new Map<string, CookLogTimes[]>();
    for (const log of cookTimes.data ?? []) {
      const list = byRecipe.get(log.recipe_id) ?? [];
      list.push(log);
      byRecipe.set(log.recipe_id, list);
    }
    return new Map(
      (recipes ?? []).map((recipe) => [
        recipe.id,
        computeInsight(
          recipe,
          kitchen.data ?? EMPTY_KITCHEN,
          byRecipe.get(recipe.id) ?? [],
          user.id,
        ),
      ]),
    );
  }, [recipes, kitchen.data, cookTimes.data, user.id]);
  return { insights: data, kitchen: kitchen.data, kitchenPending: kitchen.isPending };
}
