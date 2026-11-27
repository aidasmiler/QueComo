import { describe, expect, it } from 'vitest';
import { splitIngredientLines, splitSteps } from '@/domain/recipes/paste';

describe('splitIngredientLines', () => {
  it('drops bullets and empty lines', () => {
    expect(splitIngredientLines('- 400 g de arroz\n\n• 2 cebollas\n* Sal')).toEqual([
      '400 g de arroz',
      '2 cebollas',
      'Sal',
    ]);
  });
});

describe('splitSteps', () => {
  it('splits numbered steps and joins wrapped lines', () => {
    const text = '1. Pica la cebolla\ny el ajo.\n2) Sofríe 10 min.\n3 - Añade el arroz.';
    expect(splitSteps(text)).toEqual([
      'Pica la cebolla y el ajo.',
      'Sofríe 10 min.',
      'Añade el arroz.',
    ]);
  });

  it('understands "Paso N" headings and inline markers', () => {
    expect(splitSteps('Paso 1\nCalienta el horno.\nPaso 2: Hornea 20 min.')).toEqual([
      'Calienta el horno.',
      'Hornea 20 min.',
    ]);
  });

  it('keeps quantities that start a numbered step', () => {
    expect(splitSteps('1. Añade 200 g de harina.\n2. Mezcla 2 minutos.')).toEqual([
      'Añade 200 g de harina.',
      'Mezcla 2 minutos.',
    ]);
  });

  it('uses paragraphs when there are no numbers', () => {
    expect(splitSteps('Pica la cebolla.\nQue quede fina.\n\nSofríe a fuego lento.')).toEqual([
      'Pica la cebolla. Que quede fina.',
      'Sofríe a fuego lento.',
    ]);
  });

  it('falls back to one step per line', () => {
    expect(splitSteps('Pica la cebolla.\nSofríe.\n')).toEqual(['Pica la cebolla.', 'Sofríe.']);
  });

  it('does not treat a single leading number as a list', () => {
    expect(splitSteps('2 huevos batidos con sal.\nCuaja la tortilla.')).toEqual([
      '2 huevos batidos con sal.',
      'Cuaja la tortilla.',
    ]);
  });
});
