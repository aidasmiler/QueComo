import { beforeEach, describe, expect, it } from 'vitest';
import { isSupportedLocale, matchLocale, readDeviceLocale, writeDeviceLocale } from '@/i18n/locale';

describe('locale helpers', () => {
  beforeEach(() => localStorage.clear());

  it('maps browser tags to supported locales', () => {
    expect(matchLocale('es-ES')).toBe('es-ES');
    expect(matchLocale('es-MX')).toBe('es-ES');
    expect(matchLocale('en-US')).toBe('en-GB');
    expect(matchLocale('EN')).toBe('en-GB');
    expect(matchLocale('fr-FR')).toBe('es-ES');
    expect(matchLocale(undefined)).toBe('es-ES');
  });

  it('validates supported locales', () => {
    expect(isSupportedLocale('en-GB')).toBe(true);
    expect(isSupportedLocale('en-US')).toBe(false);
    expect(isSupportedLocale(42)).toBe(false);
  });

  it('persists the device locale and ignores invalid stored values', () => {
    writeDeviceLocale('en-GB');
    expect(readDeviceLocale()).toBe('en-GB');
    localStorage.setItem('qc.locale', 'xx-XX');
    expect(['es-ES', 'en-GB']).toContain(readDeviceLocale());
  });
});
