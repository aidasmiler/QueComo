import { describe, expect, it } from 'vitest';
import {
  formatQuantity,
  nextServings,
  parseIngredientLine,
  parseNumber,
  scaleQuantity,
} from '@/domain/recipes/quantity';

describe('parseNumber', () => {
  it('accepts decimals with comma or dot, fractions and unicode fractions', () => {
    expect(parseNumber('2')).toBe(2);
    expect(parseNumber('1,5')).toBe(1.5);
    expect(parseNumber('1.5')).toBe(1.5);
    expect(parseNumber('1/2')).toBe(0.5);
    expect(parseNumber('1 1/2')).toBe(1.5);
    expect(parseNumber('½')).toBe(0.5);
    expect(parseNumber('1½')).toBe(1.5);
  });
  it('rejects anything that is not a number', () => {
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('unos')).toBeNull();
    expect(parseNumber('1/0')).toBeNull();
  });
});

describe('parseIngredientLine', () => {
  it('extracts quantity, unit and name from common Spanish lines', () => {
    expect(parseIngredientLine('400 g de arroz')).toMatchObject({
      quantity: 400,
      unit: 'g',
      name: 'arroz',
      scalable: true,
    });
    expect(parseIngredientLine('600 ml caldo de verduras')).toMatchObject({
      quantity: 600,
      unit: 'ml',
      name: 'caldo de verduras',
    });
    expect(parseIngredientLine('2 cebollas')).toMatchObject({
      quantity: 2,
      unit: null,
      name: 'cebollas',
    });
    expect(parseIngredientLine('1/2 cucharadita de comino')).toMatchObject({
      quantity: 0.5,
      unit: 'cucharadita',
      name: 'comino',
    });
  });
  it('keeps the original text', () => {
    expect(parseIngredientLine('  2   dientes de ajo ').originalText).toBe('2 dientes de ajo');
  });
  it('marks qualitative amounts as not scalable', () => {
    expect(parseIngredientLine('Sal al gusto')).toMatchObject({
      quantity: null,
      scalable: false,
      name: 'Sal al gusto',
    });
    expect(parseIngredientLine('Aceite de oliva')).toMatchObject({ quantity: null });
  });
});

describe('scaleQuantity (§7.1 examples)', () => {
  const rice = { quantity: 400, unit: 'g', scalable: true };
  const onions = { quantity: 2, unit: null, scalable: true };
  const stock = { quantity: 600, unit: 'ml', scalable: true };

  it('scales 4 → 2 and 4 → 6 proportionally', () => {
    expect(scaleQuantity(rice, 4, 2)).toBe(200);
    expect(scaleQuantity(onions, 4, 2)).toBe(1);
    expect(scaleQuantity(stock, 4, 2)).toBe(300);
    expect(scaleQuantity(rice, 4, 6)).toBe(600);
    expect(scaleQuantity(onions, 4, 6)).toBe(3);
    expect(scaleQuantity(stock, 4, 6)).toBe(900);
  });
  it('never scales qualitative amounts and never mutates the input', () => {
    const salt = { quantity: null, unit: null, scalable: false };
    expect(scaleQuantity(salt, 4, 8)).toBeNull();
    const pinch = { quantity: 1, unit: 'pizca', scalable: false };
    expect(scaleQuantity(pinch, 4, 8)).toBe(1);
    scaleQuantity(rice, 4, 8);
    expect(rice.quantity).toBe(400);
  });
});

describe('formatQuantity', () => {
  it('uses friendly fractions for countable units', () => {
    expect(formatQuantity(0.5, null, 'es-ES')).toBe('½');
    expect(formatQuantity(1.5, 'tazas', 'es-ES')).toBe('1 ½');
    expect(formatQuantity(2 / 3, 'cucharadita', 'es-ES')).toBe('⅔');
    expect(formatQuantity(3, null, 'es-ES')).toBe('3');
  });
  it('rounds metric units sensibly with the locale decimal separator', () => {
    expect(formatQuantity(266.666, 'g', 'es-ES')).toBe('265');
    expect(formatQuantity(12.4, 'g', 'es-ES')).toBe('12');
    expect(formatQuantity(1.25, 'kg', 'es-ES')).toBe('1,3');
    expect(formatQuantity(1.25, 'kg', 'en-GB')).toBe('1.3');
  });
});

describe('nextServings', () => {
  it('steps by halves below 2 and by ones above, within 0.5–100', () => {
    expect(nextServings(4, 1)).toBe(5);
    expect(nextServings(2, -1)).toBe(1.5);
    expect(nextServings(1, 1)).toBe(1.5);
    expect(nextServings(0.5, -1)).toBe(0.5);
    expect(nextServings(100, 1)).toBe(100);
  });
});
