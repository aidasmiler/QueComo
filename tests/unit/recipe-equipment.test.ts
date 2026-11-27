import { describe, expect, it } from 'vitest';
import { autoTags, matchesDuration, type AutoTagInput } from '@/domain/recipes/auto-tags';
import type { ItemKey } from '@/domain/recipes/catalog';
import { keyRef, refKey, rowKey } from '@/domain/recipes/catalog';
import {
  evaluateEquipment,
  matchesAvailability,
  type RecipeEquipment,
  usesUtensil,
} from '@/domain/recipes/equipment';
import { effectiveTimes, median } from '@/domain/recipes/estimates';

const kitchen = (keys: ItemKey[], configured = true) => ({ configured, available: new Set(keys) });
const defined = (...methods: ItemKey[][]): RecipeEquipment => ({
  status: 'defined',
  methods: methods.map((utensils) => ({ label: null, utensils })),
});

describe('catalog keys', () => {
  it('round-trips global and custom references', () => {
    expect(refKey({ def: 'oven' })).toBe('def:oven');
    expect(keyRef('custom:abc')).toEqual({ custom: 'abc' });
    expect(rowKey(null, 'u1')).toBe('custom:u1');
    expect(rowKey('wok', null)).toBe('def:wok');
  });
});

describe('evaluateEquipment', () => {
  it('treats unspecified equipment as unknown', () => {
    expect(
      evaluateEquipment({ status: 'unspecified', methods: [] }, kitchen([])).availability,
    ).toBe('unknown');
  });

  it('treats explicitly no equipment as doable', () => {
    expect(evaluateEquipment({ status: 'none', methods: [] }, kitchen([])).availability).toBe(
      'can',
    );
  });

  it('is doable when every utensil of one method is available', () => {
    const result = evaluateEquipment(
      defined(['def:oven'], ['def:air_fryer']),
      kitchen(['def:air_fryer']),
    );
    expect(result).toEqual({
      availability: 'can',
      doableMethods: [1],
      missing: [],
      gaps: [['def:oven'], []],
    });
  });

  it('reports the closest method missing utensils', () => {
    const result = evaluateEquipment(
      defined(['def:oven', 'def:baking_tray'], ['def:silicone_steam_case']),
      kitchen(['def:baking_tray']),
    );
    expect(result.availability).toBe('missing');
    expect(result.missing).toEqual(['def:oven']);
  });

  it('never judges a household that has not configured its kitchen', () => {
    expect(evaluateEquipment(defined(['def:wok']), kitchen([], false)).availability).toBe(
      'unknown',
    );
  });

  it('works with custom utensils', () => {
    expect(evaluateEquipment(defined(['custom:x']), kitchen(['custom:x'])).availability).toBe(
      'can',
    );
  });

  it('detects a specific utensil in any method', () => {
    expect(
      usesUtensil(defined(['def:oven'], ['def:silicone_steam_case']), 'def:silicone_steam_case'),
    ).toBe(true);
    expect(usesUtensil({ status: 'none', methods: [] }, 'def:oven')).toBe(false);
  });
});

describe('matchesAvailability', () => {
  it('hides missing equipment by default only when the kitchen is configured', () => {
    expect(matchesAvailability('auto', 'missing', true)).toBe(false);
    expect(matchesAvailability('auto', 'unknown', true)).toBe(true);
    expect(matchesAvailability('auto', 'can', true)).toBe(true);
    expect(matchesAvailability('auto', 'missing', false)).toBe(true);
  });

  it('shows everything or a single state on demand', () => {
    expect(matchesAvailability('all', 'missing', true)).toBe(true);
    expect(matchesAvailability('missing', 'missing', true)).toBe(true);
    expect(matchesAvailability('missing', 'can', true)).toBe(false);
  });
});

describe('autoTags', () => {
  const base: AutoTagInput = {
    totalMinutes: null,
    activeMinutes: null,
    difficulty: null,
    equipment: { status: 'unspecified', methods: [] },
  };

  it('uses the time boundaries 15 and 30 minutes', () => {
    expect(autoTags({ ...base, totalMinutes: 15 })).toEqual(['very_quick']);
    expect(autoTags({ ...base, totalMinutes: 16 })).toEqual(['quick']);
    expect(autoTags({ ...base, totalMinutes: 30 })).toEqual(['quick']);
    expect(autoTags({ ...base, totalMinutes: 31 })).toEqual([]);
  });

  it('tags little active time and easy recipes', () => {
    expect(autoTags({ ...base, activeMinutes: 15, difficulty: 'easy' })).toEqual([
      'low_active',
      'easy',
    ]);
    expect(autoTags({ ...base, activeMinutes: 16, difficulty: 'medium' })).toEqual([]);
  });

  it('gives no tag without information', () => {
    expect(autoTags(base)).toEqual([]);
  });

  it('derives air fryer and no-oven tags from the methods', () => {
    expect(autoTags({ ...base, equipment: defined(['def:oven'], ['def:air_fryer']) })).toEqual([
      'air_fryer',
      'no_oven',
    ]);
    expect(autoTags({ ...base, equipment: defined(['def:oven']) })).toEqual([]);
    expect(autoTags({ ...base, equipment: { status: 'none', methods: [] } })).toEqual(['no_oven']);
  });
});

describe('matchesDuration', () => {
  it('filters by bucket and excludes unknown times', () => {
    expect(matchesDuration('', null)).toBe(true);
    expect(matchesDuration('le15', 15)).toBe(true);
    expect(matchesDuration('le30', 31)).toBe(false);
    expect(matchesDuration('gt60', 61)).toBe(true);
    expect(matchesDuration('le60', null)).toBe(false);
  });
});

describe('estimates', () => {
  const log = (user_id: string, total: number | null, active: number | null = null, day = 1) => ({
    user_id,
    total_minutes: total,
    active_minutes: active,
    cooked_on: `2026-11-${String(day).padStart(2, '0')}`,
  });

  it('computes medians', () => {
    expect(median([])).toBeNull();
    expect(median([30, 10, 20])).toBe(20);
    expect(median([10, 20, 30, 41])).toBe(25);
  });

  it('keeps the original time with fewer than 3 cooks', () => {
    const result = effectiveTimes({ total: 40, active: 10 }, [log('me', 20), log('me', 22)], 'me');
    expect(result.total).toEqual({ minutes: 40, source: 'original', basedOn: 0 });
    expect(result.personalised).toBe(false);
  });

  it('prefers the personal median from 3 own cooks', () => {
    const logs = [log('me', 20), log('me', 30), log('me', 25, null, 9), log('you', 60)];
    const result = effectiveTimes({ total: 40, active: null }, logs, 'me');
    expect(result.total).toEqual({ minutes: 25, source: 'personal', basedOn: 3 });
    expect(result.personal.lastCookedOn).toBe('2026-11-09');
    expect(result.household.count).toBe(4);
  });

  it('falls back to the household median', () => {
    const logs = [log('me', 20, 5), log('you', 30, 6), log('you', 50, 7)];
    const result = effectiveTimes({ total: 40, active: 15 }, logs, 'me');
    expect(result.total).toEqual({ minutes: 30, source: 'household', basedOn: 3 });
    expect(result.active).toEqual({ minutes: 6, source: 'household', basedOn: 3 });
    expect(result.personalised).toBe(true);
  });

  it('chooses each time independently', () => {
    const logs = [log('me', 20, 5), log('me', 21), log('me', 22)];
    const result = effectiveTimes({ total: 40, active: 15 }, logs, 'me');
    expect(result.total.source).toBe('personal');
    expect(result.active).toEqual({ minutes: 15, source: 'original', basedOn: 0 });
  });
});
