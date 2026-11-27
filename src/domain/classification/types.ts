import type { ItemKey } from '@/domain/recipes/catalog';

/** Catalog kinds that can be suggested. Same values as the database "kind" columns. */
export type SuggestionKind = 'category' | 'tag' | 'utensil';

/**
 * Strength of the rules that produced a suggestion (not a calibrated probability):
 * high = preselected in the form, medium = offered, low = hidden until asked for.
 */
export type Confidence = 'high' | 'medium' | 'low';

/** Where a piece of evidence was found. */
export type EvidenceSource =
  'title' | 'description' | 'mainIngredient' | 'ingredients' | 'steps' | 'notes' | 'freezingNotes';

export type ReasonCode =
  /** A term was found in `source` ("horno" in the steps). */
  | 'mention'
  /** A household keyword or custom item name was found in `source`. */
  | 'keyword'
  /** Every ingredient was recognised and none is meat or fish. */
  | 'dietNoMeat'
  /** Every ingredient was recognised and all are plant-based. */
  | 'dietPlantOnly'
  /** Some ingredients are unknown, processed or ambiguous (`term`). */
  | 'dietIncomplete'
  /** An ingredient contradicts the tag (`term`). */
  | 'dietConflict'
  /** Freezing notes are filled in and do not say it cannot be frozen. */
  | 'freezingNotes';

export interface Reason {
  code: ReasonCode;
  source?: EvidenceSource;
  /** The words as the person wrote them. */
  term?: string;
}

export interface Suggestion {
  kind: SuggestionKind;
  key: ItemKey;
  confidence: Confidence;
  reasons: Reason[];
  /**
   * Needs an explicit, informed confirmation (gluten-free, lactose-free): never preselected and
   * never included in "accept all".
   */
  requiresConfirmation: boolean;
  /** Utensils mentioned as alternatives in the same sentence ("horno o air fryer"). */
  alternativeTo?: ItemKey[];
}

/** Stable id of a suggestion: `<kind>:<item key>` (also the value stored as dismissed). */
export type SuggestionId = `${SuggestionKind}:${ItemKey}`;

export const suggestionId = (kind: SuggestionKind, key: ItemKey): SuggestionId => `${kind}:${key}`;

export function parseSuggestionId(id: string): { kind: SuggestionKind; key: ItemKey } | null {
  const match = /^(category|tag|utensil):((?:def|custom):.+)$/.exec(id);
  if (!match) return null;
  return { kind: match[1] as SuggestionKind, key: match[2] as ItemKey };
}

/**
 * Recipe content the classifier reads. Plain data on purpose: the form, the future text/voice
 * importers and URL/OCR adapters all produce it from their own draft without going through text.
 */
export interface ClassifiableRecipe {
  title: string;
  description?: string;
  ingredients: ClassifiableIngredient[];
  steps: string[];
  storageNotes?: string;
  freezingNotes?: string;
  reheatingNotes?: string;
}

export interface ClassifiableIngredient {
  /** The line as written ("200 g de espaguetis"). */
  text: string;
  /** Normalised name when known ("espaguetis"); falls back to `text`. */
  name?: string;
  quantity?: number | null;
  unit?: string | null;
  optional?: boolean;
}

/** A catalog item the classifier may suggest (globals not hidden + household custom items). */
export interface ClassificationCandidate {
  kind: SuggestionKind;
  key: ItemKey;
  /** Custom items: their name and the household keywords. Globals use the built-in dictionary. */
  terms?: string[];
}

export interface ClassificationContext {
  candidates: ClassificationCandidate[];
}

/** Anything that classifies a recipe: today the rules engine; later, optionally, an AI provider. */
export interface RecipeClassifier {
  readonly id: string;
  classify(recipe: ClassifiableRecipe, context: ClassificationContext): Suggestion[];
}
