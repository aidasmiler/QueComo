import { supabase } from '@/lib/supabase/client';
import { unwrap } from '@/lib/supabase/errors';
import type { Database } from '@/lib/supabase/database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type DietaryPreference = Database['public']['Tables']['user_dietary_preferences']['Row'];

export const PRESET_PREFERENCES = [
  { key: 'vegetarian', kind: 'restriction' },
  { key: 'vegan', kind: 'restriction' },
  { key: 'gluten_free', kind: 'restriction' },
  { key: 'lactose_free', kind: 'restriction' },
  { key: 'quick', kind: 'preference' },
  { key: 'budget', kind: 'preference' },
  { key: 'low_prep', kind: 'preference' },
  { key: 'batch_cooking', kind: 'preference' },
  { key: 'freezer_friendly', kind: 'preference' },
  { key: 'make_ahead', kind: 'preference' },
] as const;
export type PresetKey = (typeof PRESET_PREFERENCES)[number]['key'];

export async function fetchProfile(userId: string): Promise<Profile> {
  return unwrap(await supabase.from('profiles').select('*').eq('id', userId).single());
}

export async function updateProfile(
  userId: string,
  patch: Database['public']['Tables']['profiles']['Update'],
): Promise<Profile> {
  return unwrap(
    await supabase.from('profiles').update(patch).eq('id', userId).select('*').single(),
  );
}

export async function fetchDietaryPreferences(): Promise<DietaryPreference[]> {
  return unwrap(await supabase.from('user_dietary_preferences').select('*').order('created_at'));
}

export async function addDietaryPreference(
  input: { presetKey: PresetKey; kind: 'preference' | 'restriction' } | { customLabel: string },
) {
  const row: Database['public']['Tables']['user_dietary_preferences']['Insert'] =
    'presetKey' in input
      ? { preset_key: input.presetKey, kind: input.kind }
      : { custom_label: input.customLabel.trim(), kind: 'preference' };
  return unwrap(await supabase.from('user_dietary_preferences').insert(row).select('*').single());
}

export async function removeDietaryPreference(id: string) {
  unwrap(await supabase.from('user_dietary_preferences').delete().eq('id', id));
}
