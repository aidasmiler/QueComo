export type DayPart = 'morning' | 'afternoon' | 'evening';

/** Spanish-style day parts: "buenos días" until 14:00, "buenas tardes" until 21:00. */
export function dayPart(date: Date): DayPart {
  const hour = date.getHours();
  if (hour >= 6 && hour < 14) return 'morning';
  if (hour >= 14 && hour < 21) return 'afternoon';
  return 'evening';
}
