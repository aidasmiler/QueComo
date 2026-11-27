import { describe, expect, it } from 'vitest';
import {
  acceptAll,
  applyAnalysis,
  autoSelected,
  decisionsFromDismissed,
  dismissedFromDecisions,
  normalize,
  pendingSuggestions,
  pendingUtensils,
  recordManualChange,
  reject,
  rulesClassifier,
  suggestionId,
  type ClassifiableRecipe,
  type ClassificationCandidate,
  type Suggestion,
} from '@/domain/classification';
import { CATEGORY_IDS, TAG_IDS, UTENSIL_IDS } from './fixtures/catalog-ids';
import { parseIngredientLine } from '@/domain/recipes/quantity';

const GLOBALS: ClassificationCandidate[] = [
  ...CATEGORY_IDS.map((id) => ({ kind: 'category' as const, key: `def:${id}` as const })),
  ...TAG_IDS.map((id) => ({ kind: 'tag' as const, key: `def:${id}` as const })),
  ...UTENSIL_IDS.map((id) => ({ kind: 'utensil' as const, key: `def:${id}` as const })),
];

function recipe(
  title: string,
  ingredients: string[],
  steps: string[] = [],
  extra: Partial<ClassifiableRecipe> = {},
): ClassifiableRecipe {
  return {
    title,
    ingredients: ingredients.map((text) => {
      const p = parseIngredientLine(text);
      return { text, name: p.name, quantity: p.quantity, unit: p.unit };
    }),
    steps,
    ...extra,
  };
}

function classify(r: ClassifiableRecipe, candidates = GLOBALS) {
  return rulesClassifier.classify(r, { candidates });
}
/** `{ 'category:def:pasta': 'high', ... }` for compact assertions. */
function levels(list: Suggestion[]) {
  return Object.fromEntries(list.map((s) => [suggestionId(s.kind, s.key), s.confidence]));
}
const get = (list: Suggestion[], id: string) =>
  list.find((s) => suggestionId(s.kind, s.key) === id);

describe('normalize', () => {
  it('folds case, accents, punctuation and spaces', () => {
    expect(normalize('  Sartén   ANTIADHERENTE, ¡ya! ')).toBe('sarten antiadherente ya');
    expect(normalize('Lékué')).toBe('lekue');
    expect(normalize('air-fryer')).toBe('air fryer');
  });
});

describe('rules classifier · categories', () => {
  it('classifies common dishes (es)', () => {
    expect(
      levels(
        classify(
          recipe('Espaguetis a la boloñesa', [
            '400 g de espaguetis',
            '300 g de carne picada',
            '1 cebolla',
          ]),
        ),
      ),
    ).toMatchObject({ 'category:def:pasta': 'high' });
    expect(
      levels(
        classify(recipe('Risotto de champiñones', ['300 g de arroz', '250 g de champiñones'])),
      ),
    ).toMatchObject({ 'category:def:rice_grains': 'high' });
    expect(
      levels(classify(recipe('Crema de calabacín', ['2 calabacines', '1 patata', 'sal']))),
    ).toMatchObject({ 'category:def:soups': 'high' });
    expect(
      levels(
        classify(recipe('Tarta de queso', ['500 g de queso crema', '4 huevos', '200 g de azúcar'])),
      ),
    ).toMatchObject({ 'category:def:desserts': 'high' });
    expect(
      levels(classify(recipe('Ensalada de garbanzos', ['400 g de garbanzos cocidos', '1 tomate']))),
    ).toMatchObject({ 'category:def:salads': 'high', 'category:def:legumes': 'high' });
  });

  it('classifies common dishes (en)', () => {
    expect(
      levels(classify(recipe('Chicken noodle soup', ['200 g noodles', '1 chicken breast']))),
    ).toMatchObject({
      'category:def:soups': 'high',
      'category:def:pasta': 'high',
      'category:def:meat': 'high',
    });
    expect(
      levels(classify(recipe('Classic carrot cake', ['3 carrots', '200 g flour']))),
    ).toMatchObject({ 'category:def:desserts': 'high' });
    expect(
      get(
        classify(recipe('Classic carrot cake', ['3 carrots', '200 g flour'])),
        'category:def:vegetables',
      ),
    ).toBeUndefined();
  });

  it('does not classify by a secondary ingredient', () => {
    const cake = classify(
      recipe('Tarta de queso', ['500 g de queso crema', '4 huevos', '200 g de azúcar']),
    );
    expect(get(cake, 'category:def:eggs')).toBeUndefined();
    const bolognese = classify(
      recipe('Espaguetis a la boloñesa', ['400 g de espaguetis', '1 huevo', '1 cebolla']),
    );
    expect(get(bolognese, 'category:def:eggs')).toBeUndefined();
  });

  it('uses the main ingredient by weight as medium evidence', () => {
    const stew = classify(
      recipe('Guiso de la abuela', ['800 g de ternera', '2 zanahorias', '100 ml de vino']),
    );
    expect(get(stew, 'category:def:meat')?.confidence).toBe('medium');
  });

  it('prefers longer phrases over the words inside them', () => {
    expect(
      get(
        classify(recipe('Arroz con leche', ['200 g de arroz', '1 l de leche'])),
        'category:def:rice_grains',
      ),
    ).toBeUndefined();
    expect(
      get(classify(recipe('Crema catalana', ['1 l de leche', '6 yemas'])), 'category:def:soups'),
    ).toBeUndefined();
    expect(
      get(
        classify(recipe('Fajitas con tortillas de trigo', ['8 tortillas de trigo'])),
        'category:def:eggs',
      ),
    ).toBeUndefined();
  });

  it('only counts whole words (no accidental matches)', () => {
    // "pastel" contains "pasta"-like letters; "Panceta" must not be "pan".
    const r = classify(recipe('Pastel de manzana', ['3 manzanas']));
    expect(get(r, 'category:def:pasta')).toBeUndefined();
    expect(
      get(
        classify(recipe('Macarrones con panceta', ['200 g macarrones'])),
        'category:def:pizza_dough',
      ),
    ).toBeUndefined();
  });

  it('honours title position for sauces', () => {
    expect(
      get(classify(recipe('Salsa de tomate casera', ['1 kg de tomates'])), 'category:def:sauces')
        ?.confidence,
    ).toBe('high');
    expect(
      get(
        classify(recipe('Albóndigas en salsa', ['500 g de carne picada'])),
        'category:def:sauces',
      ),
    ).toBeUndefined();
    expect(
      get(classify(recipe('Homemade tomato sauce', ['1 kg tomatoes'])), 'category:def:sauces')
        ?.confidence,
    ).toBe('high');
  });

  it('gives nothing for an empty or vague recipe', () => {
    expect(classify(recipe('', []))).toEqual([]);
    expect(
      classify(recipe('Lo de los domingos', ['un poco de todo'])).filter(
        (s) => s.confidence !== 'low',
      ),
    ).toEqual([]);
  });
});

describe('rules classifier · utensils', () => {
  it('detects utensils in the steps, with synonyms and brand names', () => {
    const r = classify(
      recipe(
        'Verduras al vapor',
        ['1 calabacín'],
        [
          'Precalentar el horno a 180 grados.',
          'Triturar con una batidora de mano.',
          'Introducir el estuche Lékué en el microondas 5 minutos.',
          'Cocinar en la air fryer 10 minutos.',
        ],
      ),
    );
    expect(levels(r)).toMatchObject({
      'utensil:def:oven': 'high',
      'utensil:def:hand_blender': 'high',
      'utensil:def:silicone_steam_case': 'high',
      'utensil:def:microwave': 'high',
      'utensil:def:air_fryer': 'high',
    });
  });

  it('understands English steps', () => {
    const r = classify(
      recipe(
        'Roast veg',
        ['2 carrots'],
        ['Preheat the oven.', 'Fry in a pan.', 'Blend with a stick blender.'],
      ),
    );
    expect(levels(r)).toMatchObject({
      'utensil:def:oven': 'high',
      'utensil:def:frying_pan': 'high',
      'utensil:def:hand_blender': 'high',
    });
  });

  it('respects negations within the same sentence', () => {
    const r = classify(
      recipe(
        'Bizcocho sin horno',
        ['200 g harina'],
        ['No hace falta usar el horno.', 'Si no tienes horno, usa la air fryer.'],
      ),
    );
    expect(get(r, 'utensil:def:oven')).toBeUndefined();
    expect(get(r, 'utensil:def:air_fryer')?.confidence).toBe('high');
  });

  it('keeps weak verbs as medium evidence and blockers out', () => {
    const r = classify(
      recipe('Puré', ['1 kg patatas'], ['Triturar todo.', 'Forrar con papel de horno.']),
    );
    expect(get(r, 'utensil:def:hand_blender')?.confidence).toBe('medium');
    expect(get(r, 'utensil:def:oven')).toBeUndefined();
  });

  it('marks explicit alternatives without creating methods', () => {
    const r = classify(
      recipe('Patatas', ['1 kg patatas'], ['Cocinar en el horno o en la air fryer 20 minutos.']),
    );
    expect(get(r, 'utensil:def:oven')?.alternativeTo).toEqual(['def:air_fryer']);
    expect(get(r, 'utensil:def:air_fryer')?.alternativeTo).toEqual(['def:oven']);
  });

  it('treats reheating notes as weak evidence', () => {
    const r = classify(
      recipe('Lentejas', ['300 g lentejas'], ['Cocer.'], {
        reheatingNotes: 'Calentar en el microondas.',
      }),
    );
    expect(get(r, 'utensil:def:microwave')?.confidence).toBe('low');
  });
});

describe('rules classifier · tags', () => {
  it('suggests vegetarian/vegan only as medium and only when every ingredient is known', () => {
    const vegan = classify(
      recipe('Ensalada de garbanzos', ['400 g de garbanzos', '1 tomate', 'aceite de oliva', 'sal']),
    );
    expect(get(vegan, 'tag:def:vegetarian')?.confidence).toBe('medium');
    expect(get(vegan, 'tag:def:vegan')?.confidence).toBe('medium');

    const cheese = classify(
      recipe('Tarta de queso', ['500 g de queso crema', '4 huevos', '200 g de azúcar']),
    );
    expect(get(cheese, 'tag:def:vegetarian')?.confidence).toBe('medium');
    expect(get(cheese, 'tag:def:vegan')).toBeUndefined();

    const meat = classify(recipe('Lentejas con chorizo', ['300 g lentejas', '1 chorizo']));
    expect(get(meat, 'tag:def:vegetarian')).toBeUndefined();
  });

  it('stays low when ingredients are processed, ambiguous or unknown', () => {
    const stock = classify(recipe('Arroz meloso', ['300 g arroz', '1 l de caldo']));
    expect(get(stock, 'tag:def:vegetarian')?.confidence).toBe('low');
    expect(get(stock, 'tag:def:vegetarian')?.reasons[0]).toMatchObject({ code: 'dietIncomplete' });
    const unknown = classify(recipe('Cosa', ['2 cucharadas de zumbalumba']));
    expect(get(unknown, 'tag:def:vegan')?.confidence).toBe('low');
  });

  it('never infers gluten-free or lactose-free from missing ingredients', () => {
    const r = classify(recipe('Ensalada de garbanzos', ['400 g de garbanzos', '1 tomate']));
    expect(get(r, 'tag:def:gluten_free')).toBeUndefined();
    expect(get(r, 'tag:def:lactose_free')).toBeUndefined();
  });

  it('requires confirmation for explicit gluten/lactose claims and flags conflicts', () => {
    const ok = classify(recipe('Bizcocho sin gluten', ['200 g de harina de arroz', '3 huevos']));
    expect(get(ok, 'tag:def:gluten_free')).toMatchObject({
      confidence: 'medium',
      requiresConfirmation: true,
    });
    const conflict = classify(recipe('Bizcocho sin gluten', ['200 g de harina de trigo']));
    expect(get(conflict, 'tag:def:gluten_free')?.confidence).toBe('low');
    const lactose = classify(recipe('Natillas sin lactosa', ['1 l de leche sin lactosa']));
    expect(get(lactose, 'tag:def:lactose_free')).toMatchObject({
      confidence: 'medium',
      requiresConfirmation: true,
    });
  });

  it('detects practical tags and freezing notes', () => {
    const r = classify(
      recipe('Pasta one pot', ['300 g pasta'], ['Todo en una sola olla.'], {
        freezingNotes: 'Se puede congelar hasta 3 meses.',
      }),
    );
    expect(get(r, 'tag:def:one_pot')?.confidence).toBe('high');
    expect(get(r, 'tag:def:freezable')?.confidence).toBe('high');
    const no = classify(recipe('Ensalada', ['lechuga'], [], { freezingNotes: 'No congelar.' }));
    expect(get(no, 'tag:def:freezable')).toBeUndefined();
  });
});

describe('rules classifier · catalog', () => {
  it('suggests only existing candidates (hidden globals are left out)', () => {
    const noPasta = GLOBALS.filter((c) => c.key !== 'def:pasta');
    expect(
      get(classify(recipe('Espaguetis', ['200 g espaguetis']), noPasta), 'category:def:pasta'),
    ).toBeUndefined();
  });

  it('uses household keywords for custom items, not for other households', () => {
    const custom: ClassificationCandidate[] = [
      ...GLOBALS,
      {
        kind: 'category',
        key: 'custom:11111111-1111-1111-1111-111111111111',
        terms: ['Tuppers', 'táper'],
      },
      {
        kind: 'utensil',
        key: 'custom:22222222-2222-2222-2222-222222222222',
        terms: ['Cecotec', 'robot mambo'],
      },
    ];
    const r = classify(
      recipe('Lentejas para el táper', ['300 g lentejas'], ['Programar la Cecotec 20 minutos.']),
      custom,
    );
    expect(get(r, 'category:custom:11111111-1111-1111-1111-111111111111')).toMatchObject({
      confidence: 'high',
      reasons: [{ code: 'keyword', source: 'title', term: 'táper' }],
    });
    expect(get(r, 'utensil:custom:22222222-2222-2222-2222-222222222222')?.confidence).toBe('high');
    expect(
      get(
        classify(recipe('Lentejas para el táper', ['300 g lentejas'])),
        'category:custom:11111111-1111-1111-1111-111111111111',
      ),
    ).toBeUndefined();
  });

  it('explains every suggestion', () => {
    for (const s of classify(
      recipe('Espaguetis a la boloñesa', ['400 g de espaguetis'], ['Cocer en una olla.']),
    )) {
      expect(s.reasons.length).toBeGreaterThan(0);
    }
  });
});

describe('decisions', () => {
  const pasta: Suggestion = {
    kind: 'category',
    key: 'def:pasta',
    confidence: 'high',
    reasons: [],
    requiresConfirmation: false,
  };
  const meat: Suggestion = {
    kind: 'category',
    key: 'def:meat',
    confidence: 'medium',
    reasons: [],
    requiresConfirmation: false,
  };
  const gluten: Suggestion = {
    kind: 'tag',
    key: 'def:gluten_free',
    confidence: 'medium',
    reasons: [],
    requiresConfirmation: true,
  };
  const oven: Suggestion = {
    kind: 'utensil',
    key: 'def:oven',
    confidence: 'high',
    reasons: [],
    requiresConfirmation: false,
  };
  const empty = { category: [], tag: [] };

  it('preselects high confidence only, never utensils or confirmations', () => {
    const r = applyAnalysis(empty, {}, [pasta, meat, gluten, oven], { autoSelect: true });
    expect(r.selection).toEqual({ category: ['def:pasta'], tag: [] });
    expect(autoSelected([pasta], r.decisions)).toEqual([pasta]);
    expect(pendingSuggestions([pasta, meat, gluten], r.selection, r.decisions)).toEqual([
      meat,
      gluten,
    ]);
  });

  it('does not preselect when editing an old recipe without changes', () => {
    expect(applyAnalysis(empty, {}, [pasta], { autoSelect: false }).selection.category).toEqual([]);
  });

  it('keeps manual decisions when re-analysing', () => {
    const manual = { category: ['def:salads' as const], tag: [] };
    const r = applyAnalysis(manual, {}, [], { autoSelect: true });
    expect(r.selection.category).toEqual(['def:salads']);
  });

  it('takes back automatic selections that are no longer suggested', () => {
    const first = applyAnalysis(empty, {}, [pasta], { autoSelect: true });
    const second = applyAnalysis(
      first.selection,
      first.decisions,
      [{ ...pasta, confidence: 'medium' }],
      { autoSelect: true },
    );
    expect(second.selection.category).toEqual([]);
  });

  it('never preselects a rejected suggestion again, and persists it', () => {
    const first = applyAnalysis(empty, {}, [pasta], { autoSelect: true });
    const rejected = reject(first.selection, first.decisions, pasta);
    expect(rejected.selection.category).toEqual([]);
    const again = applyAnalysis(rejected.selection, rejected.decisions, [pasta], {
      autoSelect: true,
    });
    expect(again.selection.category).toEqual([]);
    expect(dismissedFromDecisions(again.decisions)).toEqual(['category:def:pasta']);
    const reloaded = decisionsFromDismissed(['category:def:pasta', 'garbage']);
    expect(
      applyAnalysis(empty, reloaded, [pasta], { autoSelect: true }).selection.category,
    ).toEqual([]);
  });

  it('treats removing a chip by hand as a rejection and re-adding as manual', () => {
    const first = applyAnalysis(empty, {}, [pasta], { autoSelect: true });
    const removed = recordManualChange(
      'category',
      ['def:pasta'],
      [],
      first.decisions,
      new Set(['category:def:pasta']),
    );
    expect(removed['category:def:pasta']).toBe('rejected');
    const readded = recordManualChange('category', [], ['def:pasta'], removed, new Set());
    expect(readded['category:def:pasta']).toBeUndefined();
  });

  it('accept all takes visible categories/tags, not diet claims needing confirmation', () => {
    const r = acceptAll(empty, {}, [pasta, meat, gluten]);
    expect(r.selection.category.slice().sort()).toEqual(['def:meat', 'def:pasta']);
    expect(r.selection.tag).toEqual([]);
  });

  it('lists pending utensils not yet in the equipment', () => {
    expect(pendingUtensils([oven], {}, new Set())).toEqual([oven]);
    expect(pendingUtensils([oven], {}, new Set(['def:oven' as const]))).toEqual([]);
    expect(pendingUtensils([oven], { 'utensil:def:oven': 'rejected' }, new Set())).toEqual([]);
  });
});

describe('dictionary', () => {
  it('only targets ids that exist in the global catalogs', async () => {
    const d = await import('@/domain/classification/dictionary');
    const categories = new Set<string>(CATEGORY_IDS);
    const tags = new Set<string>(TAG_IDS);
    const utensils = new Set<string>(UTENSIL_IDS);
    for (const family of Object.values(d.FAMILIES)) {
      if (family.category) expect(categories).toContain(family.category);
    }
    for (const dish of d.DISHES) if (dish.category) expect(categories).toContain(dish.category);
    for (const u of d.UTENSILS) if (u.utensil) expect(utensils).toContain(u.utensil);
    for (const t of d.TAG_TERMS) expect(tags).toContain(t.tag);
    for (const t of Object.keys(d.DIET_TERMS)) expect(tags).toContain(t);
  });
});
