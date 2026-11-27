import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/shared/page-header';
import { Alert } from '@/components/ui/alert';

// Article content lives in src/i18n/locales/*/help.json: the same source feeds the in-app help and
// docs/user-guide (see docs/user-guide/README.md), so both stay in sync and translated.
const ARTICLES = [
  'gettingStarted',
  'households',
  'invitations',
  'recipes',
  'servings',
  'equipment',
  'history',
  'classification',
  'install',
  'language',
  'faq',
] as const;

export function HelpPage() {
  const { t } = useTranslation('help');
  return (
    <>
      <PageHeader title={t('title')} subtitle={t('intro')} backTo="/profile" />
      <div className="flex max-w-2xl flex-col gap-3">
        {ARTICLES.map((key, index) => {
          const body = t(`articles.${key}.body`, { returnObjects: true }) as string[];
          return (
            <details
              key={key}
              open={index === 0}
              className="group border-border/70 bg-surface shadow-card rounded-lg border"
            >
              <summary className="font-display flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 text-lg font-semibold">
                {t(`articles.${key}.title`)}
                <ChevronDown
                  aria-hidden="true"
                  className="text-fg-muted size-5 shrink-0 transition-transform group-open:rotate-180"
                />
              </summary>
              <div className="text-fg-muted flex flex-col gap-2 px-5 pb-5">
                {body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </details>
          );
        })}
        <Alert className="mt-4">{t('contact')}</Alert>
      </div>
    </>
  );
}
