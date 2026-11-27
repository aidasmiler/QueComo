import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import {
  accept as acceptDecision,
  acceptAll as acceptAllDecisions,
  applyAnalysis,
  decisionsFromDismissed,
  dismissedFromDecisions,
  recordManualChange,
  reject as rejectDecision,
  restore as restoreDecision,
  rulesClassifier,
  suggestionId,
  type ClassifiableRecipe,
  type ClassificationCandidate,
  type Decisions,
  type Selection,
  type Suggestion,
  type SuggestionId,
} from '@/domain/classification';
import type { ItemKey } from '@/domain/recipes/catalog';
import { splitIngredientLines, splitSteps } from '@/domain/recipes/paste';
import { parseIngredientLine } from '@/domain/recipes/quantity';
import { useCatalog } from '@/features/catalogs/hooks';
import type { RecipeFormValues } from './recipe-form-page';

/** Form fields the classifier reads. Anything else (times, equipment...) does not re-run it. */
const CONTENT_FIELDS = [
  'title',
  'description',
  'ingredients',
  'ingredientsPaste',
  'steps',
  'stepsPaste',
  'storageNotes',
  'freezingNotes',
  'reheatingNotes',
] as const;
type Content = [
  string,
  string,
  RecipeFormValues['ingredients'],
  string,
  RecipeFormValues['steps'],
  string,
  string,
  string,
  string,
];

/** Pause after the last keystroke before re-analysing. */
export const ANALYSIS_DELAY_MS = 700;

/** Same conversion the form uses when saving, so suggestions match what will be stored. */
export function toClassifiable(content: Content): ClassifiableRecipe {
  const [
    title,
    description,
    rows,
    ingredientsPaste,
    steps,
    stepsPaste,
    storage,
    freezing,
    reheating,
  ] = content;
  const ingredientRows = [
    ...rows,
    ...splitIngredientLines(ingredientsPaste).map((text) => ({ text, optional: false })),
  ].filter((row) => row.text.trim() !== '');
  return {
    title,
    description,
    ingredients: ingredientRows.map((row) => {
      const parsed = parseIngredientLine(row.text);
      return {
        text: row.text,
        name: parsed.name,
        quantity: parsed.quantity,
        unit: parsed.unit,
        optional: row.optional,
      };
    }),
    steps: [...steps.map((s) => s.body), ...splitSteps(stepsPaste)],
    storageNotes: storage,
    freezingNotes: freezing,
    reheatingNotes: reheating,
  };
}

export type UtensilRole = 'required' | 'alternative' | 'optional';

export interface RecipeClassification {
  ready: boolean;
  suggestions: Suggestion[];
  decisions: Decisions;
  accept: (s: Suggestion) => void;
  reject: (s: Suggestion) => void;
  restore: (id: SuggestionId) => void;
  acceptAll: () => void;
  acceptUtensil: (s: Suggestion, role: UtensilRole) => void;
  reanalyse: () => void;
  /** Call when the person edits categories/tags by hand. */
  onManualChange: (kind: 'category' | 'tag', before: ItemKey[], after: ItemKey[]) => void;
  /** Rejected suggestion ids to save with the recipe. */
  dismissed: () => string[];
}

const same = (a: readonly ItemKey[], b: readonly ItemKey[]) =>
  a.length === b.length && a.every((k, i) => k === b[i]);

/**
 * Runs the rules classifier on the form content (debounced) and keeps the person's decisions.
 * New recipes get high-confidence categories/tags preselected; an existing recipe is left exactly
 * as saved until its content changes or the person asks to analyse it again.
 */
export function useRecipeClassification(
  form: UseFormReturn<RecipeFormValues>,
  { isNew, dismissed }: { isNew: boolean; dismissed: readonly string[] },
): RecipeClassification {
  const catalog = useCatalog();
  const candidates = useMemo<ClassificationCandidate[] | null>(() => {
    if (!catalog.data) return null;
    const { categories, tags, utensils } = catalog.data;
    return [...categories, ...tags, ...utensils]
      .filter((item) => !item.hidden)
      .map((item) => ({
        kind: item.kind,
        key: item.key,
        ...(item.custom ? { terms: [item.name, ...item.keywords] } : {}),
      }));
  }, [catalog.data]);

  const content = useWatch({ control: form.control, name: CONTENT_FIELDS }) as Content;
  const contentKey = JSON.stringify(content);
  const initialKey = useRef(contentKey);
  const analysedOnce = useRef(false);

  const [state, setState] = useState<{ suggestions: Suggestion[]; decisions: Decisions }>(() => ({
    suggestions: [],
    decisions: decisionsFromDismissed(dismissed),
  }));
  // Latest values for event handlers and timers (written only there, never during render).
  const latest = useRef(state);

  const commit = (next: { suggestions: Suggestion[]; decisions: Decisions }) => {
    latest.current = next;
    setState(next);
  };
  const selection = (): Selection => ({
    category: form.getValues('categories'),
    tag: form.getValues('tagKeys'),
  });
  const writeSelection = (next: Selection) => {
    const current = selection();
    if (!same(next.category, current.category)) {
      form.setValue('categories', [...next.category], { shouldDirty: true });
    }
    if (!same(next.tag, current.tag)) {
      form.setValue('tagKeys', [...next.tag], { shouldDirty: true });
    }
  };

  useEffect(() => {
    if (!candidates) return;
    const delay = analysedOnce.current ? ANALYSIS_DELAY_MS : 0;
    const timer = setTimeout(() => {
      analysedOnce.current = true;
      const suggestions = rulesClassifier.classify(
        toClassifiable(JSON.parse(contentKey) as Content),
        { candidates },
      );
      const autoSelect = isNew || contentKey !== initialKey.current;
      const current: Selection = {
        category: form.getValues('categories'),
        tag: form.getValues('tagKeys'),
      };
      const result = applyAnalysis(current, latest.current.decisions, suggestions, { autoSelect });
      if (!same(result.selection.category, current.category)) {
        form.setValue('categories', [...result.selection.category], { shouldDirty: true });
      }
      if (!same(result.selection.tag, current.tag)) {
        form.setValue('tagKeys', [...result.selection.tag], { shouldDirty: true });
      }
      latest.current = { suggestions, decisions: result.decisions };
      setState(latest.current);
    }, delay);
    return () => clearTimeout(timer);
  }, [contentKey, candidates, form, isNew]);

  const update = (
    fn: (s: Selection, d: Decisions) => { selection: Selection; decisions: Decisions },
  ) => {
    const result = fn(selection(), latest.current.decisions);
    writeSelection(result.selection);
    commit({ suggestions: latest.current.suggestions, decisions: result.decisions });
  };

  return {
    ready: candidates !== null,
    suggestions: state.suggestions,
    decisions: state.decisions,
    accept: (s) => update((sel, d) => acceptDecision(sel, d, s)),
    reject: (s) => update((sel, d) => rejectDecision(sel, d, s)),
    restore: (id) =>
      commit({ ...latest.current, decisions: restoreDecision(latest.current.decisions, id) }),
    acceptAll: () => update((sel, d) => acceptAllDecisions(sel, d, latest.current.suggestions)),
    acceptUtensil: (s, role) => {
      if (role === 'optional') {
        const optional = form.getValues('optionalUtensils');
        if (!optional.includes(s.key)) {
          form.setValue('optionalUtensils', [...optional, s.key], { shouldDirty: true });
        }
      } else {
        const methods = form.getValues('methods').map((m) => ({ ...m, utensils: [...m.utensils] }));
        const used = methods.filter((m) => m.utensils.length > 0);
        if (role === 'alternative' && used.length > 0 && methods.length < 5) {
          // A new method with just this utensil; the person completes it.
          const next = [...used, { label: '', utensils: [s.key] }];
          form.setValue('methods', next, { shouldDirty: true });
        } else {
          const target = used.length ? used : [{ label: '', utensils: [] as ItemKey[] }];
          // Required in every method that the recipe already has.
          for (const m of target) if (!m.utensils.includes(s.key)) m.utensils.push(s.key);
          form.setValue('methods', target, { shouldDirty: true });
        }
        // Confirming a utensil is the person's decision, so the equipment becomes "defined".
        if (form.getValues('equipmentStatus') !== 'defined') {
          form.setValue('equipmentStatus', 'defined', { shouldDirty: true });
        }
      }
      update((sel, d) => acceptDecision(sel, d, s));
    },
    reanalyse: () => {
      if (!candidates) return;
      const values = form.getValues();
      const suggestions = rulesClassifier.classify(
        toClassifiable(CONTENT_FIELDS.map((name) => values[name]) as unknown as Content),
        { candidates },
      );
      const result = applyAnalysis(selection(), latest.current.decisions, suggestions, {
        autoSelect: true,
      });
      writeSelection(result.selection);
      commit({ suggestions, decisions: result.decisions });
    },
    onManualChange: (kind, before, after) => {
      const suggested = new Set(latest.current.suggestions.map((s) => suggestionId(s.kind, s.key)));
      commit({
        ...latest.current,
        decisions: recordManualChange(kind, before, after, latest.current.decisions, suggested),
      });
    },
    dismissed: () => dismissedFromDecisions(latest.current.decisions),
  };
}

export const ClassificationContext = createContext<RecipeClassification | null>(null);

export function useClassification(): RecipeClassification | null {
  return useContext(ClassificationContext);
}
