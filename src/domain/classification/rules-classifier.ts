import type { ItemKey } from '@/domain/recipes/catalog';
import {
  DIET_TERMS,
  DISHES,
  DOMINANT_CATEGORIES,
  FAMILIES,
  FREEZING_POSITIVE,
  TAG_TERMS,
  UTENSILS,
  type DietClass,
  type Family,
} from './dictionary';
import { normalize, SearchableText, type TextMatch } from './text';
import {
  suggestionId,
  type ClassifiableIngredient,
  type ClassifiableRecipe,
  type ClassificationContext,
  type Confidence,
  type EvidenceSource,
  type Reason,
  type RecipeClassifier,
  type Suggestion,
  type SuggestionId,
  type SuggestionKind,
} from './types';

// ---------------------------------------------------------------------------------------------
// Compiled dictionaries
// ---------------------------------------------------------------------------------------------
interface Entry<T> {
  target: T;
  phrase: string;
  weak?: boolean;
  at?: 'start' | 'end';
}

function entries<T>(target: T, terms: string[], extra: Omit<Entry<T>, 'target' | 'phrase'> = {}) {
  const seen = new Set<string>();
  const out: Entry<T>[] = [];
  for (const term of terms) {
    const phrase = normalize(term);
    if (phrase && !seen.has(phrase)) {
      seen.add(phrase);
      out.push({ target, phrase, ...extra });
    }
  }
  return out;
}

const DISH_ENTRIES = DISHES.flatMap((d) => entries(d.category, d.terms, { at: d.at }));
const FAMILY_ENTRIES = Object.entries(FAMILIES).flatMap(([id, family]) =>
  entries(id, family.terms),
);
const UTENSIL_ENTRIES = UTENSILS.flatMap((u) => entries(u.utensil, u.terms, { weak: u.weak }));
const TAG_ENTRIES = TAG_TERMS.flatMap((t) => entries(t.tag, t.terms));
const TAG_MAX = new Map(TAG_TERMS.map((t) => [t.tag, t.max] as const));
const DIET_ENTRIES = Object.entries(DIET_TERMS).flatMap(([tag, terms]) => entries(tag, terms));
const FREEZING_ENTRIES = entries('freezable', FREEZING_POSITIVE);

interface Hit<T> extends TextMatch {
  target: T;
  weak?: boolean;
}

/**
 * Finds every entry, then keeps the longest non-overlapping matches so a specific phrase wins
 * over the words inside it ("crema catalana" over "crema de", "olla a presión" over "olla").
 */
function longestMatches<T>(text: SearchableText, list: Entry<T>[]): Hit<T>[] {
  if (!text.original.trim()) return [];
  const all: Hit<T>[] = [];
  for (const entry of list) {
    for (const match of text.find(entry.phrase)) {
      if (entry.at === 'start' && text.folded.slice(0, match.start).trim() !== '') continue;
      if (entry.at === 'end' && text.folded.slice(match.end).trim() !== '') continue;
      all.push({ ...match, target: entry.target, weak: entry.weak });
    }
  }
  all.sort((a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start);
  const kept: Hit<T>[] = [];
  for (const hit of all) {
    if (kept.every((k) => hit.end <= k.start || hit.start >= k.end)) kept.push(hit);
  }
  return kept.sort((a, b) => a.start - b.start);
}

// ---------------------------------------------------------------------------------------------
// Evidence board: points per source (max per source, summed across sources)
// ---------------------------------------------------------------------------------------------
const RANK: Record<Confidence, number> = { low: 0, medium: 1, high: 2 };

function toConfidence(points: number): Confidence {
  if (points >= 3) return 'high';
  if (points >= 2) return 'medium';
  return 'low';
}

interface Evidence {
  kind: SuggestionKind;
  key: ItemKey;
  bySource: Map<string, number>;
  reasons: Reason[];
  cap: Confidence;
  requiresConfirmation: boolean;
  alternativeTo: Set<ItemKey>;
}

class Board {
  readonly items = new Map<SuggestionId, Evidence>();

  private get(kind: SuggestionKind, key: ItemKey): Evidence {
    const id = suggestionId(kind, key);
    let item = this.items.get(id);
    if (!item) {
      item = {
        kind,
        key,
        bySource: new Map(),
        reasons: [],
        cap: 'high',
        requiresConfirmation: false,
        alternativeTo: new Set(),
      };
      this.items.set(id, item);
    }
    return item;
  }

  add(kind: SuggestionKind, key: ItemKey, points: number, slot: string, reason: Reason) {
    if (points <= 0) return;
    const item = this.get(kind, key);
    item.bySource.set(slot, Math.max(item.bySource.get(slot) ?? 0, points));
    const dup = item.reasons.some(
      (r) => r.code === reason.code && r.source === reason.source && r.term === reason.term,
    );
    if (!dup && item.reasons.length < 6) item.reasons.push(reason);
  }

  cap(kind: SuggestionKind, key: ItemKey, cap: Confidence) {
    const item = this.items.get(suggestionId(kind, key));
    if (item && RANK[cap] < RANK[item.cap]) item.cap = cap;
  }

  confirm(kind: SuggestionKind, key: ItemKey) {
    const item = this.items.get(suggestionId(kind, key));
    if (item) item.requiresConfirmation = true;
  }

  alternative(a: ItemKey, b: ItemKey) {
    const ia = this.items.get(suggestionId('utensil', a));
    const ib = this.items.get(suggestionId('utensil', b));
    ia?.alternativeTo.add(b);
    ib?.alternativeTo.add(a);
  }

  drop(kind: SuggestionKind, key: ItemKey, slots: string[]) {
    const item = this.items.get(suggestionId(kind, key));
    if (!item) return;
    for (const slot of slots) item.bySource.delete(slot);
  }

  result(allowed: Set<SuggestionId>): Suggestion[] {
    const out: Suggestion[] = [];
    for (const [id, item] of this.items) {
      if (!allowed.has(id)) continue;
      const points = [...item.bySource.values()].reduce((a, b) => a + b, 0);
      if (points <= 0) continue;
      let confidence = toConfidence(points);
      if (RANK[confidence] > RANK[item.cap]) confidence = item.cap;
      out.push({
        kind: item.kind,
        key: item.key,
        confidence,
        reasons: item.reasons,
        requiresConfirmation: item.requiresConfirmation,
        ...(item.alternativeTo.size ? { alternativeTo: [...item.alternativeTo] } : {}),
      });
    }
    const kindOrder: Record<SuggestionKind, number> = { category: 0, tag: 1, utensil: 2 };
    return out.sort(
      (a, b) => RANK[b.confidence] - RANK[a.confidence] || kindOrder[a.kind] - kindOrder[b.kind],
    );
  }
}

const def = (id: string): ItemKey => `def:${id}`;
const mention = (source: EvidenceSource, term: string): Reason => ({
  code: 'mention',
  source,
  term,
});

// ---------------------------------------------------------------------------------------------
// Ingredients
// ---------------------------------------------------------------------------------------------
const MASS: Record<string, number> = { g: 1, kg: 1000, mg: 0.001, ml: 1, cl: 10, dl: 100, l: 1000 };

interface AnalysedIngredient {
  source: ClassifiableIngredient;
  text: SearchableText;
  families: Hit<string>[];
  main: boolean;
}

function analyseIngredients(list: ClassifiableIngredient[]): AnalysedIngredient[] {
  const rows = list
    .filter((i) => (i.name ?? i.text).trim() !== '')
    .map((source) => {
      const text = new SearchableText(source.name?.trim() ? source.name : source.text);
      return { source, text, families: longestMatches(text, FAMILY_ENTRIES), main: false };
    });
  // Main ingredients: a big share of the weighed ingredients (>= 25 %). Count-based amounts
  // ("4 huevos") are never main on their own: that is what keeps a cake out of "Eggs".
  const weights = rows.map((r) => {
    const unit = r.source.unit?.toLowerCase() ?? '';
    const factor = MASS[unit];
    return !r.source.optional && factor && r.source.quantity ? r.source.quantity * factor : 0;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  rows.forEach((row, index) => {
    row.main = total > 0 && (weights[index] ?? 0) / total >= 0.25;
  });
  return rows;
}

function familyOf(id: string): Family {
  return FAMILIES[id] as Family;
}

// ---------------------------------------------------------------------------------------------
// The classifier
// ---------------------------------------------------------------------------------------------
interface Fields {
  title: SearchableText;
  description: SearchableText;
  steps: SearchableText[];
  storage: SearchableText;
  freezing: SearchableText;
  reheating: SearchableText;
  ingredients: AnalysedIngredient[];
}

function prepare(recipe: ClassifiableRecipe): Fields {
  return {
    title: new SearchableText(recipe.title),
    description: new SearchableText(recipe.description ?? ''),
    steps: recipe.steps.filter((s) => s.trim() !== '').map((s) => new SearchableText(s)),
    storage: new SearchableText(recipe.storageNotes ?? ''),
    freezing: new SearchableText(recipe.freezingNotes ?? ''),
    reheating: new SearchableText(recipe.reheatingNotes ?? ''),
    ingredients: analyseIngredients(recipe.ingredients),
  };
}

const positive = <T>(hits: Hit<T>[]) => hits.filter((h) => !h.negated);

function classifyCategories(f: Fields, board: Board) {
  const titleDishes = positive(longestMatches(f.title, DISH_ENTRIES));
  for (const hit of titleDishes) {
    if (hit.target) board.add('category', def(hit.target), 3, 'title', mention('title', hit.text));
  }
  for (const hit of positive(longestMatches(f.description, DISH_ENTRIES))) {
    if (hit.target) {
      board.add('category', def(hit.target), 2, 'description', mention('description', hit.text));
    }
  }
  for (const step of f.steps) {
    for (const hit of positive(longestMatches(step, DISH_ENTRIES))) {
      if (hit.target)
        board.add('category', def(hit.target), 1, 'steps', mention('steps', hit.text));
    }
  }

  // Ingredient families: in the title (the dish is "of" that ingredient) or as main ingredient.
  const titleFamilies = positive(longestMatches(f.title, FAMILY_ENTRIES));
  const ingredientCategories = new Set<string>();
  for (const hit of titleFamilies) {
    const family = familyOf(hit.target);
    if (!family.category) continue;
    ingredientCategories.add(family.category);
    const points = family.titleStrength === 'strong' ? 3 : 2;
    board.add('category', def(family.category), points, 'titleFamily', mention('title', hit.text));
  }
  for (const row of f.ingredients) {
    if (!row.main) continue;
    for (const hit of positive(row.families)) {
      const family = familyOf(hit.target);
      if (!family.category) continue;
      ingredientCategories.add(family.category);
      board.add(
        'category',
        def(family.category),
        2,
        'mainIngredient',
        mention('mainIngredient', row.source.text),
      );
    }
  }

  // A dessert, drink or sauce is defined by the dish, not by what goes into it.
  const dominant = titleDishes
    .map((h) => h.target)
    .filter((c): c is string => c !== null && DOMINANT_CATEGORIES.has(c));
  if (dominant.length) {
    const savoury = titleFamilies.some((h) => familyOf(h.target).diet === 'flesh');
    if (savoury) {
      // "Tarta de atún": keep both, but the dessert reading is only a suggestion.
      for (const c of dominant) board.cap('category', def(c), 'medium');
    } else {
      for (const c of ingredientCategories) {
        if (!dominant.includes(c))
          board.drop('category', def(c), ['titleFamily', 'mainIngredient']);
      }
    }
  }
}

function classifyUtensils(f: Fields, board: Board) {
  const scan = (text: SearchableText, slot: EvidenceSource, strong: number, weak: number) => {
    const hits = positive(longestMatches(text, UTENSIL_ENTRIES)).filter((h) => h.target !== null);
    for (const hit of hits) {
      board.add(
        'utensil',
        def(hit.target as string),
        hit.weak ? weak : strong,
        slot,
        mention(slot, hit.text),
      );
    }
    return hits;
  };
  scan(f.title, 'title', 2, 0);
  scan(f.description, 'description', 2, 1);
  for (const step of f.steps) {
    const hits = scan(step, 'steps', 3, 2);
    // "en el horno o en la air fryer": both stay suggestions, marked as alternatives.
    for (let i = 0; i + 1 < hits.length; i++) {
      const a = hits[i] as Hit<string | null>;
      const b = hits[i + 1] as Hit<string | null>;
      if (a.target === b.target || a.weak || b.weak) continue;
      const words = step.wordsBetween(a.end, b.start);
      if (words.length <= 5 && words.some((w) => w === 'o' || w === 'u' || w === 'or')) {
        board.alternative(def(a.target as string), def(b.target as string));
      }
    }
  }
  // Storage/reheating are about leftovers, not about cooking: weak evidence only.
  scan(f.storage, 'notes', 1, 0);
  scan(f.reheating, 'notes', 1, 0);
}

function classifyTags(f: Fields, board: Board) {
  const scan = (text: SearchableText, slot: EvidenceSource, points: number) => {
    for (const hit of positive(longestMatches(text, TAG_ENTRIES))) {
      board.add('tag', def(hit.target), points, slot, mention(slot, hit.text));
    }
  };
  scan(f.title, 'title', 3);
  scan(f.description, 'description', 2);
  for (const step of f.steps) scan(step, 'steps', 1);
  scan(f.storage, 'notes', 2);
  for (const [tag, max] of TAG_MAX) board.cap('tag', def(tag), max);

  // Freezable: the person filled in freezing notes and they do not say "do not freeze".
  for (const [text, points] of [
    [f.freezing, 3],
    [f.storage, 2],
  ] as const) {
    const hits = text.original.trim() ? longestMatches(text, FREEZING_ENTRIES) : [];
    if (hits.some((h) => h.negated)) continue;
    if (hits.length) {
      board.add('tag', def('freezable'), points, `freezing-${points}`, {
        code: 'freezingNotes',
        term: hits[0]?.text,
      });
    } else if (
      text === f.freezing &&
      text.original.trim() &&
      !/\bno\b|\bnot\b/i.test(text.folded)
    ) {
      board.add('tag', def('freezable'), 2, 'freezing-2', { code: 'freezingNotes' });
    }
  }
  classifyDiet(f, board);
}

function classifyDiet(f: Fields, board: Board) {
  const explicit = new Map<string, string>();
  const scan = (text: SearchableText, slot: EvidenceSource, points: number) => {
    for (const hit of positive(longestMatches(text, DIET_ENTRIES))) {
      explicit.set(hit.target, hit.text);
      board.add('tag', def(hit.target), points, slot, mention(slot, hit.text));
    }
  };
  scan(f.title, 'title', 3);
  scan(f.description, 'description', 2);
  scan(f.storage, 'notes', 1);

  // What the ingredients say. Unknown or processed ingredients mean "cannot tell".
  const classes = new Set<DietClass>();
  let firstUnknown: string | undefined;
  let flesh: string | undefined;
  let animal: string | undefined;
  let gluten: string | undefined;
  let lactose: string | undefined;
  for (const row of f.ingredients) {
    const lineSays = (tag: 'gluten_free' | 'lactose_free') =>
      DIET_TERMS[tag].some((t) => row.text.find(normalize(t)).length > 0);
    const hits = row.families.filter((h) => !h.negated);
    if (!hits.length) {
      classes.add('unknown');
      firstUnknown ??= row.source.text;
      continue;
    }
    for (const hit of hits) {
      const family = familyOf(hit.target);
      classes.add(family.diet);
      if (family.diet === 'unknown') firstUnknown ??= row.source.text;
      if (family.diet === 'flesh') flesh ??= row.source.text;
      if (family.diet === 'animalProduct') animal ??= row.source.text;
      if (family.gluten && !lineSays('gluten_free')) gluten ??= row.source.text;
      if (family.lactose && !lineSays('lactose_free')) lactose ??= row.source.text;
    }
  }
  const known = f.ingredients.length > 0 && !classes.has('unknown');

  // Vegetarian / vegan: medium at most, never a promise.
  if (flesh) {
    for (const tag of ['vegetarian', 'vegan']) {
      if (explicit.has(tag)) {
        board.cap('tag', def(tag), 'low');
        board.add('tag', def(tag), 0.1, 'conflict', { code: 'dietConflict', term: flesh });
      }
    }
  } else if (f.ingredients.length) {
    if (known) {
      board.add('tag', def('vegetarian'), 2, 'ingredients', { code: 'dietNoMeat' });
    } else {
      board.add('tag', def('vegetarian'), 1, 'ingredients', {
        code: 'dietIncomplete',
        term: firstUnknown,
      });
    }
    if (animal) {
      if (explicit.has('vegan')) {
        board.cap('tag', def('vegan'), 'low');
        board.add('tag', def('vegan'), 0.1, 'conflict', { code: 'dietConflict', term: animal });
      }
    } else if (known && !classes.has('plantUnsure')) {
      board.add('tag', def('vegan'), 2, 'ingredients', { code: 'dietPlantOnly' });
    } else {
      board.add('tag', def('vegan'), 1, 'ingredients', {
        code: 'dietIncomplete',
        term:
          firstUnknown ??
          f.ingredients.find((r) =>
            r.families.some((h) => familyOf(h.target).diet === 'plantUnsure'),
          )?.source.text,
      });
    }
  }
  board.cap('tag', def('vegetarian'), 'medium');
  board.cap('tag', def('vegan'), 'medium');

  // Gluten-free / lactose-free: only from explicit wording, always confirmed by the person.
  for (const [tag, conflict] of [
    ['gluten_free', gluten],
    ['lactose_free', lactose],
  ] as const) {
    board.cap('tag', def(tag), conflict ? 'low' : 'medium');
    if (conflict && explicit.has(tag)) {
      board.add('tag', def(tag), 0.1, 'conflict', { code: 'dietConflict', term: conflict });
    }
    board.confirm('tag', def(tag));
  }
}

/** Household custom items: their name and owner-defined keywords. */
function classifyCustom(f: Fields, board: Board, context: ClassificationContext) {
  const custom = context.candidates.filter((c) => c.key.startsWith('custom:') && c.terms?.length);
  if (!custom.length) return;
  for (const kind of ['category', 'tag', 'utensil'] as const) {
    const list = custom
      .filter((c) => c.kind === kind)
      .flatMap((c) => entries(c.key, c.terms ?? []));
    if (!list.length) continue;
    const add = (text: SearchableText, slot: EvidenceSource, points: number) => {
      for (const hit of positive(longestMatches(text, list))) {
        board.add(kind, hit.target, points, slot, {
          code: 'keyword',
          source: slot,
          term: hit.text,
        });
      }
    };
    if (kind === 'utensil') {
      add(f.title, 'title', 2);
      add(f.description, 'description', 2);
      for (const step of f.steps) add(step, 'steps', 3);
      add(f.storage, 'notes', 1);
      add(f.reheating, 'notes', 1);
    } else {
      add(f.title, 'title', 3);
      add(f.description, 'description', 2);
      for (const row of f.ingredients)
        add(row.text, row.main ? 'mainIngredient' : 'ingredients', row.main ? 2 : 1);
      for (const step of f.steps) add(step, 'steps', 1);
      add(f.storage, 'notes', 1);
    }
  }
}

/**
 * Rules and dictionaries, no network, no AI. Deterministic and fast enough to run on every
 * pause while typing. Suggests only items in `context.candidates` (never creates any).
 */
export const rulesClassifier: RecipeClassifier = {
  id: 'rules-v1',
  classify(recipe, context) {
    const fields = prepare(recipe);
    const board = new Board();
    classifyCategories(fields, board);
    classifyUtensils(fields, board);
    classifyTags(fields, board);
    classifyCustom(fields, board, context);
    const allowed = new Set(context.candidates.map((c) => suggestionId(c.kind, c.key)));
    return board.result(allowed);
  },
};

/** Merges suggestions from several classifiers (rules today, maybe AI later). */
export function combineSuggestions(...lists: Suggestion[][]): Suggestion[] {
  const merged = new Map<SuggestionId, Suggestion>();
  for (const suggestion of lists.flat()) {
    const id = suggestionId(suggestion.kind, suggestion.key);
    const current = merged.get(id);
    if (!current) {
      merged.set(id, { ...suggestion, reasons: [...suggestion.reasons] });
      continue;
    }
    if (RANK[suggestion.confidence] > RANK[current.confidence]) {
      current.confidence = suggestion.confidence;
    }
    current.requiresConfirmation ||= suggestion.requiresConfirmation;
    current.reasons.push(...suggestion.reasons);
    if (suggestion.alternativeTo) {
      current.alternativeTo = [
        ...new Set([...(current.alternativeTo ?? []), ...suggestion.alternativeTo]),
      ];
    }
  }
  return [...merged.values()];
}
