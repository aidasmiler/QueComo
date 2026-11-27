/**
 * Text helpers for the rules classifier: accent/case-insensitive, whole-word phrase search
 * that maps matches back to the original text and detects simple negations.
 */

/**
 * Lowercases, removes diacritics and turns anything that is not a letter or digit into a space,
 * keeping exactly one output character per UTF-16 unit so offsets map back to the original.
 */
export function foldKeepLength(text: string): string {
  let out = '';
  for (const char of text) {
    const base = char.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
    const first = base.charAt(0);
    out += (/[a-z0-9]/.test(first) ? first : ' ').repeat(char.length);
  }
  return out;
}

/** Normalised form used for dictionaries and keywords: folded, single spaces, trimmed. */
export function normalize(text: string): string {
  return foldKeepLength(text).replace(/ +/g, ' ').trim();
}

const NEGATORS = new Set([
  // es
  'sin',
  'no',
  'ni',
  'nunca',
  'tampoco',
  // en
  'without',
  'not',
  'never',
  'dont',
  'don',
  'doesn',
  'isn',
  'skip',
]);
/** How many words before a match may hold a negation ("no hace falta usar el horno"). */
const NEGATION_WINDOW = 5;
/** Clause boundaries: a negation never crosses them ("Si no tienes horno, usa la air fryer"). */
const CLAUSE_BREAK = /[.;:!?,()\n\r]/;

export interface TextMatch {
  /** Offsets in the original text. */
  start: number;
  end: number;
  /** The matched text as the person wrote it. */
  text: string;
  negated: boolean;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const patternCache = new Map<string, RegExp>();

/** Whole-word, plural-tolerant pattern for a normalised phrase ("olla" matches "ollas"). */
function phrasePattern(phrase: string): RegExp {
  let pattern = patternCache.get(phrase);
  if (!pattern) {
    const words = phrase.split(' ').map(escape).join(' +');
    pattern = new RegExp(`(?<![a-z0-9])${words}(?:e?s)?(?![a-z0-9])`, 'g');
    patternCache.set(phrase, pattern);
  }
  pattern.lastIndex = 0;
  return pattern;
}

/** A piece of text prepared once and searched many times. */
export class SearchableText {
  readonly folded: string;

  constructor(readonly original: string) {
    this.folded = foldKeepLength(original);
  }

  /** All matches of a normalised phrase, with negation detection. */
  find(phrase: string): TextMatch[] {
    if (!phrase) return [];
    const matches: TextMatch[] = [];
    const pattern = phrasePattern(phrase);
    for (let m = pattern.exec(this.folded); m; m = pattern.exec(this.folded)) {
      const start = m.index;
      const end = start + m[0].length;
      matches.push({
        start,
        end,
        text: this.original.slice(start, end),
        negated: this.isNegated(start),
      });
    }
    return matches;
  }

  /** True when one of the few words before `offset`, in the same clause, is a negation. */
  isNegated(offset: number): boolean {
    let clauseStart = 0;
    for (let i = offset - 1; i >= 0; i--) {
      if (CLAUSE_BREAK.test(this.original.charAt(i))) {
        clauseStart = i + 1;
        break;
      }
    }
    const words = this.folded.slice(clauseStart, offset).trim().split(/ +/).filter(Boolean);
    return words.slice(-NEGATION_WINDOW).some((word) => NEGATORS.has(word));
  }

  /** Words between two offsets (folded), used to spot "horno o air fryer". */
  wordsBetween(from: number, to: number): string[] {
    if (to <= from) return [];
    const between = this.original.slice(from, to);
    if (CLAUSE_BREAK.test(between.replace(/,/g, ''))) return ['|'];
    return this.folded.slice(from, to).trim().split(/ +/).filter(Boolean);
  }
}
