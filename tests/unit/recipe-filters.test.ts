import { describe, expect, it } from 'vitest';
import type { RecipeSummary } from '@/features/recipes/api';
import { computeInsight } from '@/features/recipes/insights';
import {
  countActive,
  EMPTY_FILTERS,
  matchesBase,
  matchesFilters,
  type FilterContext,
} from '@/features/recipes/recipe-filters';

function recipe(id: string, patch: Partial<RecipeSummary> = {}): RecipeSummary {
  return {
    id,
    household_id: 'h',
    title: id,
    description: null,
    base_servings: 2,
    difficulty: null,
    active_minutes: null,
    passive_minutes: null,
    total_minutes: null,
    tags: [],
    source_url: null,
    source_author: null,
    notes: null,
    storage_notes: null,
    freezing_notes: null,
    reheating_notes: null,
    photo_path: null,
    archived_at: null,
    created_at: '',
    created_by: null,
    updated_at: '',
    equipment_status: 'unspecified',
    categoryKeys: [],
    tagKeys: [],
    equipment: { status: 'unspecified', methods: [] },
    ...patch,
  };
}

const recipes = [
  recipe('salmon-lekue', {
    total_minutes: 12,
    categoryKeys: ['def:fish_seafood'],
    tagKeys: ['def:high_protein'],
    equipment: {
      status: 'defined',
      methods: [
        { label: 'Lékué', utensils: ['def:silicone_steam_case', 'def:microwave'] },
        { label: null, utensils: ['def:oven'] },
      ],
    },
  }),
  recipe('lentils', { total_minutes: 60, categoryKeys: ['def:legumes'], difficulty: 'easy' }),
  recipe('bread', {
    total_minutes: 180,
    active_minutes: 20,
    equipment: { status: 'defined', methods: [{ label: null, utensils: ['def:stand_mixer'] }] },
  }),
];

function context(available: string[], configured = true): FilterContext {
  const kitchen = { configured, available: new Set(available as never[]) };
  return {
    insights: new Map(recipes.map((r) => [r.id, computeInsight(r, kitchen, [], 'me')])),
    favorites: (id) => id === 'lentils',
    kitchenConfigured: configured,
    searchText: (r) => r.title,
  };
}

const ids = (ctx: FilterContext, filters = EMPTY_FILTERS) =>
  recipes.filter((r) => matchesFilters(r, filters, ctx)).map((r) => r.id);

describe('recipe filters', () => {
  it('hides recipes missing equipment by default and keeps unknown ones', () => {
    expect(ids(context(['def:oven']))).toEqual(['salmon-lekue', 'lentils']);
  });

  it('hides nothing while the kitchen is not configured', () => {
    expect(ids(context([], false))).toEqual(['salmon-lekue', 'lentils', 'bread']);
  });

  it('shows all recipes or only one availability state on demand', () => {
    const ctx = context(['def:oven']);
    expect(ids(ctx, { ...EMPTY_FILTERS, availability: 'all' })).toHaveLength(3);
    expect(ids(ctx, { ...EMPTY_FILTERS, availability: 'missing' })).toEqual(['bread']);
    expect(ids(ctx, { ...EMPTY_FILTERS, availability: 'unknown' })).toEqual(['lentils']);
  });

  it('filters by a specific utensil combined with categories and tags', () => {
    const ctx = context(['def:silicone_steam_case', 'def:microwave']);
    const filters = {
      ...EMPTY_FILTERS,
      utensil: 'def:silicone_steam_case' as const,
      categories: ['def:fish_seafood' as const],
      tags: ['def:high_protein' as const],
    };
    expect(ids(ctx, filters)).toEqual(['salmon-lekue']);
    expect(ids(ctx, { ...filters, tags: ['def:vegan'] })).toEqual([]);
  });

  it('combines automatic tags, durations, favourites and search', () => {
    const ctx = context([], false);
    expect(ids(ctx, { ...EMPTY_FILTERS, autoTags: ['very_quick'] })).toEqual(['salmon-lekue']);
    expect(ids(ctx, { ...EMPTY_FILTERS, autoTags: ['easy'], view: 'favorites' })).toEqual([
      'lentils',
    ]);
    expect(ids(ctx, { ...EMPTY_FILTERS, total: 'gt60' })).toEqual(['bread']);
    expect(ids(ctx, { ...EMPTY_FILTERS, active: 'le30' })).toEqual(['bread']);
    expect(ids(ctx, { ...EMPTY_FILTERS, query: 'LENT' })).toEqual(['lentils']);
  });

  it('separates the base match from availability to count hidden recipes', () => {
    const ctx = context(['def:oven']);
    const base = recipes.filter((r) => matchesBase(r, EMPTY_FILTERS, ctx));
    expect(base).toHaveLength(3);
  });

  it('counts active refinements', () => {
    expect(countActive(EMPTY_FILTERS, 'auto')).toBe(0);
    expect(
      countActive(
        { ...EMPTY_FILTERS, tags: ['def:vegan'], total: 'le15', availability: 'all' },
        'auto',
      ),
    ).toBe(3);
  });
});
