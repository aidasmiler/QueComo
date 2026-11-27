import type { ItemKey } from './catalog';

export type EquipmentStatus = 'unspecified' | 'none' | 'defined';

export interface PreparationMethod {
  label: string | null;
  utensils: ItemKey[];
}

export interface RecipeEquipment {
  status: EquipmentStatus;
  methods: PreparationMethod[];
}

/** can: doable with the household's equipment · missing: no method is doable · unknown: no data. */
export type Availability = 'can' | 'missing' | 'unknown';

export interface EquipmentEvaluation {
  availability: Availability;
  /** Positions of the methods the household can use. */
  doableMethods: number[];
  /** For a 'missing' recipe: the utensils lacking in the method closest to being doable. */
  missing: ItemKey[];
  /** Missing utensils of each method, by position (empty when not evaluated). */
  gaps: ItemKey[][];
}

export interface Kitchen {
  /** The household has gone through the equipment screen at least once. */
  configured: boolean;
  available: ReadonlySet<ItemKey>;
}

/**
 * A recipe is doable when every utensil of AT LEAST ONE of its methods is available.
 * Alternatives are only the methods the recipe defines explicitly: nothing is inferred.
 * Without a configured kitchen nothing can be judged, so 'defined' recipes are 'unknown'.
 */
export function evaluateEquipment(
  equipment: RecipeEquipment,
  kitchen: Kitchen,
): EquipmentEvaluation {
  if (equipment.status === 'none') {
    return { availability: 'can', doableMethods: [], missing: [], gaps: [] };
  }
  if (equipment.status === 'unspecified' || equipment.methods.length === 0 || !kitchen.configured) {
    return { availability: 'unknown', doableMethods: [], missing: [], gaps: [] };
  }
  const gaps = equipment.methods.map((method) =>
    [...new Set(method.utensils)].filter((key) => !kitchen.available.has(key)),
  );
  const doableMethods = gaps.flatMap((gap, index) => (gap.length === 0 ? [index] : []));
  if (doableMethods.length) return { availability: 'can', doableMethods, missing: [], gaps };
  const closest = gaps.reduce((best, gap) => (gap.length < best.length ? gap : best));
  return { availability: 'missing', doableMethods, missing: closest, gaps };
}

/** 'auto' shows doable and unknown recipes and hides those missing equipment. */
export type AvailabilityFilter = 'auto' | 'all' | 'can' | 'missing' | 'unknown';

export function matchesAvailability(
  filter: AvailabilityFilter,
  availability: Availability,
  kitchenConfigured: boolean,
): boolean {
  // Never hide anything because of equipment the household has not told us about.
  if (filter === 'auto') return !kitchenConfigured || availability !== 'missing';
  if (filter === 'all') return true;
  return availability === filter;
}

/** True when any method of the recipe uses the utensil. */
export function usesUtensil(equipment: RecipeEquipment, key: ItemKey): boolean {
  return equipment.methods.some((method) => method.utensils.includes(key));
}
