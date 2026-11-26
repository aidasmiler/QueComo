/**
 * Pure helpers for recipe quantities (PRODUCT_SPEC §7.1, §27). No I/O, no React.
 *
 * - Scaling: adjusted = base × target / baseServings. The original recipe is never modified.
 * - Qualitative amounts ("al gusto", no number) are never scaled.
 * - Parsing keeps the user's text and only extracts quantity/unit when it is unambiguous.
 */

export interface IngredientAmount {
  quantity: number | null;
  unit: string | null;
  scalable: boolean;
}

export interface ParsedIngredient extends IngredientAmount {
  name: string;
  originalText: string;
}

const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 1 / 2,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '¼': 1 / 4,
  '¾': 3 / 4,
  '⅕': 1 / 5,
  '⅛': 1 / 8,
};

/** Units we recognise (lowercase). Kept small on purpose: anything else stays in the name. */
const UNITS = [
  'kg',
  'g',
  'mg',
  'l',
  'dl',
  'cl',
  'ml',
  'cucharada',
  'cucharadas',
  'cda',
  'cdas',
  'cucharadita',
  'cucharaditas',
  'cdta',
  'cdtas',
  'taza',
  'tazas',
  'vaso',
  'vasos',
  'pizca',
  'pizcas',
  'diente',
  'dientes',
  'lata',
  'latas',
  'sobre',
  'sobres',
  'rebanada',
  'rebanadas',
  'loncha',
  'lonchas',
  'puñado',
  'puñados',
  'manojo',
  'manojos',
  'tbsp',
  'tsp',
  'cup',
  'cups',
  'oz',
  'lb',
  'clove',
  'cloves',
  'pinch',
  'can',
  'cans',
  'slice',
  'slices',
] as const;

const QUALITATIVE = /\b(al gusto|c\.?\s?s\.?|cantidad suficiente|to taste|a pinch of)\b/i;

/** Parses "1", "1,5", "1.5", "1/2", "1 1/2", "½", "1½". Returns null if it isn't a number. */
export function parseNumber(input: string): number | null {
  const text = input.trim().replace(',', '.');
  if (!text) return null;
  const unicode = /^(\d+)?\s*([½⅓⅔¼¾⅕⅛])$/.exec(text);
  if (unicode) {
    const whole = unicode[1] ? Number(unicode[1]) : 0;
    const fraction = UNICODE_FRACTIONS[unicode[2] ?? ''] ?? 0;
    return whole + fraction;
  }
  const mixed = /^(\d+)\s+(\d+)\/(\d+)$/.exec(text);
  if (mixed) {
    const den = Number(mixed[3]);
    return den === 0 ? null : Number(mixed[1]) + Number(mixed[2]) / den;
  }
  const fraction = /^(\d+)\/(\d+)$/.exec(text);
  if (fraction) {
    const den = Number(fraction[2]);
    return den === 0 ? null : Number(fraction[1]) / den;
  }
  if (/^\d+(\.\d+)?$/.test(text)) return Number(text);
  return null;
}

const NUMBER_PATTERN = String.raw`(\d+\s+\d+\/\d+|\d+\/\d+|\d+\s*[½⅓⅔¼¾⅕⅛]|[½⅓⅔¼¾⅕⅛]|\d+(?:[.,]\d+)?)`;
const LINE = new RegExp(
  String.raw`^\s*${NUMBER_PATTERN}\s*([a-zA-Zñáéíóú.]+)?\s*(?:de\s+|of\s+)?(.*)$`,
  'i',
);

/**
 * Splits an ingredient line into quantity, unit and name, keeping the original text.
 * "400 g de arroz" → 400, "g", "arroz". "2 cebollas" → 2, null, "cebollas". "Sal al gusto" → not
 * scalable. When in doubt, the whole line becomes the name with no quantity.
 */
export function parseIngredientLine(line: string): ParsedIngredient {
  const originalText = line.trim().replace(/\s+/g, ' ');
  const fallback: ParsedIngredient = {
    originalText,
    name: originalText,
    quantity: null,
    unit: null,
    scalable: !QUALITATIVE.test(originalText),
  };
  if (!originalText) return fallback;
  if (QUALITATIVE.test(originalText)) return { ...fallback, scalable: false };

  const match = LINE.exec(originalText);
  if (!match) return { ...fallback, scalable: false };
  const quantity = parseNumber(match[1] ?? '');
  if (quantity === null || quantity <= 0) return { ...fallback, scalable: false };

  const maybeUnit = (match[2] ?? '').replace(/\.$/, '');
  const rest = (match[3] ?? '').trim();
  const isUnit = (UNITS as readonly string[]).includes(maybeUnit.toLowerCase());
  const name = isUnit ? rest : [match[2], match[3]].filter(Boolean).join(' ').trim();
  if (!name) return { ...fallback, scalable: false };
  return {
    originalText,
    name: name.replace(/^(de|of)\s+/i, ''),
    quantity,
    unit: isUnit ? maybeUnit.toLowerCase() : null,
    scalable: true,
  };
}

/** adjusted = base × target / baseServings, or null when the amount must not be scaled. */
export function scaleQuantity(
  amount: IngredientAmount,
  baseServings: number,
  targetServings: number,
): number | null {
  if (amount.quantity === null) return null;
  if (!amount.scalable || baseServings <= 0 || targetServings <= 0) return amount.quantity;
  return (amount.quantity * targetServings) / baseServings;
}

const NICE_FRACTIONS: [number, string][] = [
  [1 / 4, '¼'],
  [1 / 3, '⅓'],
  [1 / 2, '½'],
  [2 / 3, '⅔'],
  [3 / 4, '¾'],
];

/** Units where fractions read naturally ("½ cebolla", "1 ½ tazas"); metric units use decimals. */
const METRIC = new Set(['kg', 'g', 'mg', 'l', 'dl', 'cl', 'ml', 'oz', 'lb']);

/**
 * Formats a quantity for display. Countable/kitchen units use friendly fractions when close
 * (within 2 %); metric units are rounded sensibly (grams to integers above 10, etc.).
 */
export function formatQuantity(value: number, unit: string | null, locale: string): string {
  const metric = unit !== null && METRIC.has(unit.toLowerCase());
  if (!metric) {
    const whole = Math.floor(value);
    const fraction = value - whole;
    if (fraction < 0.02) return format(whole, locale, 0);
    if (fraction > 0.98) return format(whole + 1, locale, 0);
    const nice = NICE_FRACTIONS.find(([v]) => Math.abs(fraction - v) <= 0.02 * Math.max(1, value));
    if (nice) return whole > 0 ? `${format(whole, locale, 0)} ${nice[1]}` : nice[1];
    return format(value, locale, value < 10 ? 1 : 0);
  }
  if (value >= 100) return format(Math.round(value / 5) * 5, locale, 0);
  if (value >= 10) return format(Math.round(value), locale, 0);
  return format(value, locale, value < 1 ? 2 : 1);
}

function format(value: number, locale: string, maxFractionDigits: number) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: maxFractionDigits }).format(value);
}

/** Servings step used by the +/- control: halves for small values, whole numbers otherwise. */
export function nextServings(current: number, direction: 1 | -1): number {
  const step = current < 2 || (direction === -1 && current <= 2) ? 0.5 : 1;
  const next = current + direction * step;
  return Math.min(100, Math.max(0.5, Math.round(next * 2) / 2));
}
