import {
  AUTO_TAGS,
  matchesDuration,
  type AutoTag,
  type DurationFilter,
} from '@/domain/recipes/auto-tags';
import type { ItemKey } from '@/domain/recipes/catalog';
import {
  matchesAvailability,
  usesUtensil,
  type AvailabilityFilter,
} from '@/domain/recipes/equipment';
import type { RecipeSummary } from './api';
import { normalise } from './format';
import type { RecipeInsight } from './insights';

export type View = 'all' | 'favorites' | 'archived';

export interface RecipeFilters {
  query: string;
  view: View;
  /** Any of the selected categories. */
  categories: ItemKey[];
  /** All of the selected manual tags. */
  tags: ItemKey[];
  /** All of the selected automatic tags. */
  autoTags: AutoTag[];
  utensil: ItemKey | '';
  total: DurationFilter;
  active: DurationFilter;
  availability: AvailabilityFilter;
}

export const EMPTY_FILTERS: RecipeFilters = {
  query: '',
  view: 'all',
  categories: [],
  tags: [],
  autoTags: [],
  utensil: '',
  total: '',
  active: '',
  availability: 'auto',
};

export const isAutoTag = (value: string): value is AutoTag =>
  (AUTO_TAGS as readonly string[]).includes(value);

export interface FilterContext {
  insights: Map<string, RecipeInsight>;
  favorites: (recipeId: string) => boolean;
  kitchenConfigured: boolean;
  /** Names of the recipe's categories and tags, so search finds them too. */
  searchText: (recipe: RecipeSummary) => string;
}

/** Everything except availability, so the list can tell how many recipes equipment hides. */
export function matchesBase(recipe: RecipeSummary, filters: RecipeFilters, ctx: FilterContext) {
  if (filters.view === 'archived' ? !recipe.archived_at : recipe.archived_at) return false;
  if (filters.view === 'favorites' && !ctx.favorites(recipe.id)) return false;
  if (
    filters.categories.length &&
    !filters.categories.some((k) => recipe.categoryKeys.includes(k))
  ) {
    return false;
  }
  if (!filters.tags.every((k) => recipe.tagKeys.includes(k))) return false;
  const insight = ctx.insights.get(recipe.id);
  if (
    filters.autoTags.length &&
    !filters.autoTags.every((tag) => insight?.autoTags.includes(tag))
  ) {
    return false;
  }
  if (filters.utensil && !usesUtensil(recipe.equipment, filters.utensil)) return false;
  if (!matchesDuration(filters.total, insight?.times.total.minutes ?? null)) return false;
  if (!matchesDuration(filters.active, insight?.times.active.minutes ?? null)) return false;
  const needle = normalise(filters.query.trim());
  return !needle || normalise(ctx.searchText(recipe)).includes(needle);
}

export function matchesFilters(recipe: RecipeSummary, filters: RecipeFilters, ctx: FilterContext) {
  if (!matchesBase(recipe, filters, ctx)) return false;
  const availability = ctx.insights.get(recipe.id)?.evaluation.availability ?? 'unknown';
  return matchesAvailability(filters.availability, availability, ctx.kitchenConfigured);
}

/** Number of refinements applied besides the search box, the view and the default availability. */
export function countActive(filters: RecipeFilters, defaultAvailability: AvailabilityFilter) {
  return (
    filters.categories.length +
    filters.tags.length +
    filters.autoTags.length +
    (filters.utensil ? 1 : 0) +
    (filters.total ? 1 : 0) +
    (filters.active ? 1 : 0) +
    (filters.availability !== defaultAvailability ? 1 : 0)
  );
}
