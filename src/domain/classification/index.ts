/**
 * Smart recipe classification (pure domain, no UI or Supabase).
 * - Deterministic tags (quick, easy, air fryer...) live in ../recipes/auto-tags.ts.
 * - Suggestions come from a RecipeClassifier; today `rulesClassifier`.
 * - Form decisions (auto/accepted/rejected) are handled by ./decisions.ts.
 */
export * from './types';
export * from './decisions';
export { rulesClassifier, combineSuggestions } from './rules-classifier';
export { normalize } from './text';
