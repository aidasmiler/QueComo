export const SUPPORTED_LOCALES = ['es-ES', 'en-GB'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'es-ES';

const DEVICE_LOCALE_KEY = 'qc.locale';

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Maps any BCP-47 tag (e.g. "en-US", "es") to the closest supported locale. */
export function matchLocale(tag: string | undefined | null): SupportedLocale {
  if (!tag) return DEFAULT_LOCALE;
  if (isSupportedLocale(tag)) return tag;
  return tag.toLowerCase().startsWith('en') ? 'en-GB' : DEFAULT_LOCALE;
}

/**
 * Device-level locale used before the profile loads (avoids a flash of the wrong language) and on
 * the auth screens. The authenticated profile is always the source of truth once available.
 */
export function readDeviceLocale(): SupportedLocale {
  try {
    const stored = localStorage.getItem(DEVICE_LOCALE_KEY);
    if (isSupportedLocale(stored)) return stored;
  } catch {
    // Storage can be unavailable (private mode); fall back to the browser language.
  }
  return matchLocale(typeof navigator === 'undefined' ? undefined : navigator.language);
}

export function writeDeviceLocale(locale: SupportedLocale) {
  try {
    localStorage.setItem(DEVICE_LOCALE_KEY, locale);
  } catch {
    // Non-critical: the profile still stores the preference.
  }
}
