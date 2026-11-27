import { keyRef } from '@/domain/recipes/catalog';
import type { RecipeDetail, RecipeInput } from './api';

/** Builds the save_recipe payload from a stored recipe (used to duplicate). */
export function toRecipeInput(recipe: RecipeDetail): RecipeInput {
  return {
    id: recipe.id,
    household_id: recipe.household_id,
    title: recipe.title,
    description: recipe.description,
    base_servings: Number(recipe.base_servings),
    difficulty: (recipe.difficulty as RecipeInput['difficulty']) ?? null,
    active_minutes: recipe.active_minutes,
    passive_minutes: recipe.passive_minutes,
    total_minutes: recipe.total_minutes,
    source_url: recipe.source_url,
    source_author: recipe.source_author,
    notes: recipe.notes,
    storage_notes: recipe.storage_notes,
    freezing_notes: recipe.freezing_notes,
    reheating_notes: recipe.reheating_notes,
    categories: recipe.categoryKeys.map(keyRef),
    tag_links: recipe.tagKeys.map(keyRef),
    equipment_status: recipe.equipment.status,
    methods: recipe.equipment.methods.map((m) => ({
      label: m.label,
      utensils: m.utensils.map(keyRef),
    })),
    optional_utensils: recipe.optionalUtensils.map(keyRef),
    dismissed_suggestions: recipe.dismissed_suggestions ?? [],
    ingredients: recipe.ingredients.map((i) => ({
      original_text: i.original_text,
      quantity: i.quantity === null ? null : Number(i.quantity),
      unit: i.unit,
      name: i.name,
      scalable: i.scalable,
      optional: i.optional,
    })),
    steps: recipe.steps.map((s) => ({ body: s.body, timer_minutes: s.timer_minutes })),
  };
}
