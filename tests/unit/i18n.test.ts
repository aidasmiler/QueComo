import { describe, expect, it } from 'vitest';
import { resources } from '@/i18n';

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? keys(value as object, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe('translations', () => {
  it('es-ES and en-GB expose the same keys in every namespace', () => {
    for (const ns of Object.keys(resources['es-ES']) as Array<keyof (typeof resources)['es-ES']>) {
      expect(keys(resources['en-GB'][ns]).sort(), ns).toEqual(keys(resources['es-ES'][ns]).sort());
    }
  });
});
