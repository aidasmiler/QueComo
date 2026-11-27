import type { ItemKey } from '@/domain/recipes/catalog';
import { parseSuggestionId, suggestionId, type Suggestion, type SuggestionId } from './types';

/**
 * What happened to a suggestion in the form:
 * - auto: preselected by the engine (high confidence); re-analysing may take it back;
 * - accepted: the person accepted it; never touched again by the engine;
 * - rejected: the person rejected it (or removed it); never preselected again, saved with the
 *   recipe as `dismissed_suggestions`.
 * Items the person picks by hand have no decision: the engine never removes them.
 */
export type Decision = 'auto' | 'accepted' | 'rejected';
export type Decisions = Readonly<Partial<Record<SuggestionId, Decision>>>;

/** Selected categories and tags (the values saved with the recipe). */
export interface Selection {
  category: readonly ItemKey[];
  tag: readonly ItemKey[];
}

const SELECTABLE = new Set(['category', 'tag']);

/** Can this suggestion be preselected or bulk-accepted? (Utensils and diet claims cannot.) */
export function isAutoSelectable(s: Suggestion): boolean {
  return SELECTABLE.has(s.kind) && !s.requiresConfirmation;
}

export function decisionsFromDismissed(dismissed: readonly string[]): Decisions {
  const out: Partial<Record<SuggestionId, Decision>> = {};
  for (const id of dismissed) if (parseSuggestionId(id)) out[id as SuggestionId] = 'rejected';
  return out;
}

export function dismissedFromDecisions(decisions: Decisions): SuggestionId[] {
  return (Object.keys(decisions) as SuggestionId[])
    .filter((id) => decisions[id] === 'rejected')
    .sort();
}

function withKey(list: readonly ItemKey[], key: ItemKey, present: boolean): ItemKey[] {
  const has = list.includes(key);
  if (present && !has) return [...list, key];
  if (!present && has) return list.filter((k) => k !== key);
  return [...list];
}

/**
 * Applies a fresh analysis:
 * - preselects high-confidence category/tag suggestions with no decision yet (when `autoSelect`);
 * - takes back earlier automatic selections that are no longer high confidence;
 * - leaves accepted, rejected and hand-picked items exactly as they are.
 */
export function applyAnalysis(
  selection: Selection,
  decisions: Decisions,
  suggestions: readonly Suggestion[],
  { autoSelect }: { autoSelect: boolean },
): { selection: Selection; decisions: Decisions } {
  const next: Partial<Record<SuggestionId, Decision>> = { ...decisions };
  let category = [...selection.category];
  let tag = [...selection.tag];
  const byId = new Map(suggestions.map((s) => [suggestionId(s.kind, s.key), s] as const));

  for (const id of Object.keys(next) as SuggestionId[]) {
    if (next[id] !== 'auto') continue;
    const s = byId.get(id);
    if (s && s.confidence === 'high' && isAutoSelectable(s)) continue;
    const parsed = parseSuggestionId(id);
    if (parsed?.kind === 'category') category = withKey(category, parsed.key, false);
    if (parsed?.kind === 'tag') tag = withKey(tag, parsed.key, false);
    delete next[id];
  }

  if (autoSelect) {
    for (const s of suggestions) {
      if (s.confidence !== 'high' || !isAutoSelectable(s)) continue;
      const id = suggestionId(s.kind, s.key);
      if (next[id]) continue;
      const list = s.kind === 'category' ? category : tag;
      if (list.includes(s.key)) continue;
      if (s.kind === 'category') category = [...category, s.key];
      else tag = [...tag, s.key];
      next[id] = 'auto';
    }
  }
  return { selection: { category, tag }, decisions: next };
}

/**
 * Records hand edits of a list (chip picker): removing a suggested or engine-selected item
 * rejects it; picking a rejected item by hand clears the rejection.
 */
export function recordManualChange(
  kind: 'category' | 'tag',
  before: readonly ItemKey[],
  after: readonly ItemKey[],
  decisions: Decisions,
  suggested: ReadonlySet<SuggestionId>,
): Decisions {
  const next: Partial<Record<SuggestionId, Decision>> = { ...decisions };
  for (const key of before) {
    if (after.includes(key)) continue;
    const id = suggestionId(kind, key);
    if (next[id] || suggested.has(id)) next[id] = 'rejected';
  }
  for (const key of after) {
    if (before.includes(key)) continue;
    const id = suggestionId(kind, key);
    if (next[id] === 'rejected' || next[id] === 'auto') delete next[id];
  }
  return next;
}

export function accept(
  selection: Selection,
  decisions: Decisions,
  s: Suggestion,
): { selection: Selection; decisions: Decisions } {
  const id = suggestionId(s.kind, s.key);
  if (s.kind === 'utensil') return { selection, decisions: { ...decisions, [id]: 'accepted' } };
  return {
    selection: {
      category:
        s.kind === 'category' ? withKey(selection.category, s.key, true) : [...selection.category],
      tag: s.kind === 'tag' ? withKey(selection.tag, s.key, true) : [...selection.tag],
    },
    decisions: { ...decisions, [id]: 'accepted' },
  };
}

export function reject(
  selection: Selection,
  decisions: Decisions,
  s: Suggestion,
): { selection: Selection; decisions: Decisions } {
  const id = suggestionId(s.kind, s.key);
  // Rejecting only undoes what the engine did; an accepted item is removed by hand instead.
  const undo = decisions[id] === 'auto';
  return {
    selection: {
      category:
        undo && s.kind === 'category'
          ? withKey(selection.category, s.key, false)
          : [...selection.category],
      tag: undo && s.kind === 'tag' ? withKey(selection.tag, s.key, false) : [...selection.tag],
    },
    decisions: { ...decisions, [id]: 'rejected' },
  };
}

/** Clears a rejection (the suggestion shows up again as pending). */
export function restore(decisions: Decisions, id: SuggestionId): Decisions {
  const next = { ...decisions };
  delete next[id];
  return next;
}

/** "Accept all": every visible (high/medium) category or tag that needs no special confirmation. */
export function acceptAll(
  selection: Selection,
  decisions: Decisions,
  suggestions: readonly Suggestion[],
): { selection: Selection; decisions: Decisions } {
  let state = { selection, decisions };
  for (const s of pendingSuggestions(suggestions, selection, decisions)) {
    if (isAutoSelectable(s)) state = accept(state.selection, state.decisions, s);
  }
  // Auto-selected ones become accepted so a later analysis cannot take them back.
  const next: Partial<Record<SuggestionId, Decision>> = { ...state.decisions };
  for (const id of Object.keys(next) as SuggestionId[])
    if (next[id] === 'auto') next[id] = 'accepted';
  return { selection: state.selection, decisions: next };
}

export type SuggestionStatus = 'auto' | 'pending';

/**
 * Category/tag suggestions still waiting for the person: not rejected, not accepted, not
 * already picked by hand, and at least medium confidence (low ones only when `includeLow`).
 */
export function pendingSuggestions(
  suggestions: readonly Suggestion[],
  selection: Selection,
  decisions: Decisions,
  { includeLow = false }: { includeLow?: boolean } = {},
): Suggestion[] {
  return suggestions.filter((s) => {
    if (s.kind === 'utensil') return false;
    const id = suggestionId(s.kind, s.key);
    if (decisions[id]) return false;
    if ((s.kind === 'category' ? selection.category : selection.tag).includes(s.key)) return false;
    return includeLow || s.confidence !== 'low';
  });
}

/** Suggestions preselected by the engine in this session (shown so they can be undone). */
export function autoSelected(
  suggestions: readonly Suggestion[],
  decisions: Decisions,
): Suggestion[] {
  return suggestions.filter((s) => decisions[suggestionId(s.kind, s.key)] === 'auto');
}

/** Utensil suggestions not yet handled: not rejected/accepted and not already in the equipment. */
export function pendingUtensils(
  suggestions: readonly Suggestion[],
  decisions: Decisions,
  inEquipment: ReadonlySet<ItemKey>,
  { includeLow = false }: { includeLow?: boolean } = {},
): Suggestion[] {
  return suggestions.filter((s) => {
    if (s.kind !== 'utensil') return false;
    if (decisions[suggestionId(s.kind, s.key)]) return false;
    if (inEquipment.has(s.key)) return false;
    return includeLow || s.confidence !== 'low';
  });
}
