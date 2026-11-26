import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LOCALES, matchLocale, type SupportedLocale } from '@/i18n/locale';

/** Plain native select: accessible and comfortable on mobile. */
export function LanguageSelect({
  value,
  onChange,
  id,
  compact = false,
}: {
  value?: string;
  onChange: (locale: SupportedLocale) => void;
  id?: string;
  compact?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const current = matchLocale(value ?? i18n.language);
  return (
    <span className="relative inline-flex items-center">
      {compact && (
        <Languages
          aria-hidden="true"
          className="text-fg-muted pointer-events-none absolute left-3 size-4"
        />
      )}
      <select
        id={id}
        aria-label={compact ? t('language.label') : undefined}
        value={current}
        onChange={(event) => onChange(matchLocale(event.target.value))}
        className={
          compact
            ? 'border-border bg-surface min-h-11 appearance-none rounded-full border pr-4 pl-9 text-sm font-medium'
            : 'border-border bg-surface min-h-12 w-full appearance-none rounded-md border px-4 text-base'
        }
      >
        {SUPPORTED_LOCALES.map((locale) => (
          <option key={locale} value={locale}>
            {t(`language.${locale}`)}
          </option>
        ))}
      </select>
    </span>
  );
}
