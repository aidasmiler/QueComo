import type { RecipeEquipment } from './equipment';

export const AUTO_TAGS = [
  'very_quick',
  'quick',
  'low_active',
  'easy',
  'air_fryer',
  'no_oven',
] as const;
export type AutoTag = (typeof AUTO_TAGS)[number];

export const AIR_FRYER = 'def:air_fryer';
export const OVEN = 'def:oven';

export interface AutoTagInput {
  /** Effective times (personal or household estimate, or the recipe's own time). */
  totalMinutes: number | null;
  activeMinutes: number | null;
  difficulty: string | null;
  equipment: RecipeEquipment;
}

/**
 * Tags computed from the recipe's data, never stored. Missing information gives no tag:
 * an unknown time is neither quick nor slow, an unspecified equipment is neither oven nor not.
 */
export function autoTags({ totalMinutes, activeMinutes, difficulty, equipment }: AutoTagInput) {
  const tags: AutoTag[] = [];
  if (totalMinutes !== null && totalMinutes <= 15) tags.push('very_quick');
  else if (totalMinutes !== null && totalMinutes <= 30) tags.push('quick');
  if (activeMinutes !== null && activeMinutes <= 15) tags.push('low_active');
  if (difficulty === 'easy') tags.push('easy');
  const methods = equipment.status === 'defined' ? equipment.methods : [];
  if (methods.some((method) => method.utensils.includes(AIR_FRYER))) tags.push('air_fryer');
  // 'none' means the recipe explicitly needs no special equipment, so no oven either.
  if (
    equipment.status === 'none' ||
    methods.some((method) => method.utensils.length > 0 && !method.utensils.includes(OVEN))
  ) {
    tags.push('no_oven');
  }
  return tags;
}

/** Duration filter buckets, applied to the effective total or active time. */
export type DurationFilter = '' | 'le15' | 'le30' | 'le60' | 'gt60';

export function matchesDuration(filter: DurationFilter, minutes: number | null): boolean {
  if (!filter) return true;
  if (minutes === null) return false;
  if (filter === 'le15') return minutes <= 15;
  if (filter === 'le30') return minutes <= 30;
  if (filter === 'le60') return minutes <= 60;
  return minutes > 60;
}
