/**
 * Pure helpers to split pasted text into ingredient lines or recipe steps (§8.3, no AI).
 * Always followed by the user's review in the form, so they favour predictable rules.
 */

const BULLET = /^\s*[-•*·–]\s*/;
/** "1.", "1)", "1 -", "Paso 1:", "Step 1." at the start of a line. */
const STEP_MARKER = /^\s*(?:(?:paso|step)\s*)?\d{1,2}\s*(?:[.)\-:–]|\s(?=[A-ZÁÉÍÓÚÑ¿¡]))\s*/i;
const STEP_HEADING = /^\s*(?:paso|step)\s*\d{1,2}\s*$/i;

const MAX_ITEMS = 100;

/** One ingredient per non-empty line, without list bullets. */
export function splitIngredientLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(BULLET, '').trim())
    .filter(Boolean)
    .slice(0, MAX_ITEMS);
}

/**
 * Splits pasted instructions into steps:
 * - numbered lines ("1.", "2)", "Paso 3:") start a new step; following unnumbered lines join it;
 * - otherwise blank lines separate steps (paragraphs);
 * - otherwise each non-empty line is a step.
 */
export function splitSteps(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const clean = (parts: string[]) =>
    parts
      .map((part) => part.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, MAX_ITEMS);

  const numbered = lines.filter((line) => STEP_MARKER.test(line) || STEP_HEADING.test(line));
  if (numbered.length >= 2) {
    const steps: string[] = [];
    let current: string | null = null;
    for (const line of lines) {
      if (STEP_HEADING.test(line)) {
        if (current !== null) steps.push(current);
        current = '';
      } else if (STEP_MARKER.test(line)) {
        if (current !== null) steps.push(current);
        current = line.replace(STEP_MARKER, '');
      } else if (current !== null) {
        current += ` ${line}`;
      } else if (line.trim()) {
        current = line;
      }
    }
    if (current !== null) steps.push(current);
    return clean(steps);
  }

  if (/\n\s*\n/.test(text)) return clean(text.split(/\n\s*\n/));
  return clean(lines.map((line) => line.replace(BULLET, '')));
}
