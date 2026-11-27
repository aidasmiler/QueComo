import type { TFunction } from 'i18next';

export function formatMinutes(t: TFunction<'recipes'>, minutes: number) {
  if (minutes < 60) return t('time.minutes', { count: minutes });
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? t('time.hoursMinutes', { hours, minutes: rest }) : t('time.hours', { hours });
}

/** Total time: explicit value, or active + passive when only those are known. */
export function totalMinutes(recipe: {
  active_minutes: number | null;
  passive_minutes: number | null;
  total_minutes: number | null;
}): number | null {
  if (recipe.total_minutes !== null) return recipe.total_minutes;
  if (recipe.active_minutes === null && recipe.passive_minutes === null) return null;
  return (recipe.active_minutes ?? 0) + (recipe.passive_minutes ?? 0);
}

/** Case- and accent-insensitive search text. */
export function normalise(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}
