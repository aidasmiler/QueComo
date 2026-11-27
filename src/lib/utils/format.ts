/** Locale-aware date formatting through Intl (never concatenated strings). */
export function formatDate(
  value: string | Date,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat(
    locale,
    options ?? { day: 'numeric', month: 'long', year: 'numeric' },
  ).format(date);
}
