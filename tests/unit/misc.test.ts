import { describe, expect, it } from 'vitest';
import { dayPart } from '@/features/home/greeting';
import { detectPlatform } from '@/features/profile/platform';
import { AppError, toAppError } from '@/lib/supabase/errors';
import { formatDate } from '@/lib/utils/format';

describe('dayPart', () => {
  it('follows Spanish greeting conventions', () => {
    expect(dayPart(new Date(2026, 0, 1, 9))).toBe('morning');
    expect(dayPart(new Date(2026, 0, 1, 14))).toBe('afternoon');
    expect(dayPart(new Date(2026, 0, 1, 21, 30))).toBe('evening');
    expect(dayPart(new Date(2026, 0, 1, 2))).toBe('evening');
  });
});

describe('detectPlatform', () => {
  it('detects iOS including iPadOS desktop mode', () => {
    expect(detectPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')).toBe('ios');
    expect(detectPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)).toBe('ios');
    expect(detectPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0)).toBe('desktop');
    expect(detectPlatform('Mozilla/5.0 (Linux; Android 15; Pixel 9)')).toBe('android');
    expect(detectPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('desktop');
  });
});

describe('toAppError', () => {
  it('extracts our stable server codes from PostgREST errors', () => {
    const error = toAppError({ message: 'QC_LAST_OWNER', code: 'P0001' });
    expect(error).toBeInstanceOf(AppError);
    expect(error.kind).toBe('server');
    expect(error.code).toBe('QC_LAST_OWNER');
  });

  it('recognises auth and network errors', () => {
    expect(
      toAppError({ message: 'Invalid login credentials', code: 'invalid_credentials' }).kind,
    ).toBe('auth');
    expect(toAppError(new TypeError('Failed to fetch')).kind).toBe('network');
    expect(toAppError({ message: 'boom' }).kind).toBe('unknown');
  });
});

describe('formatDate', () => {
  it('formats with the given locale without shifting the calendar day', () => {
    const date = new Date(2026, 10, 30, 23, 30);
    expect(formatDate(date, 'es-ES')).toBe('30 de noviembre de 2026');
    expect(formatDate(date, 'en-GB')).toBe('30 November 2026');
  });
});
