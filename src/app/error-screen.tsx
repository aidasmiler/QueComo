import { CloudOff, SearchX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';

export function ErrorScreen({ onRetry }: { onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="bg-bg grid min-h-dvh place-items-center px-6 text-center">
      <div className="flex max-w-sm flex-col items-center gap-4">
        <span className="bg-accent-soft text-accent-strong grid size-16 place-items-center rounded-full">
          <CloudOff aria-hidden="true" className="size-8" />
        </span>
        <h1 className="text-3xl">{t('error.title')}</h1>
        <p className="text-fg-muted">{t('error.body')}</p>
        <Button onClick={onRetry ?? (() => window.location.reload())}>{t('actions.retry')}</Button>
      </div>
    </div>
  );
}

export function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-[60dvh] place-items-center px-6 text-center">
      <div className="flex max-w-sm flex-col items-center gap-4">
        <span className="bg-primary-soft text-primary grid size-16 place-items-center rounded-full">
          <SearchX aria-hidden="true" className="size-8" />
        </span>
        <h1 className="text-3xl">{t('error.notFoundTitle')}</h1>
        <p className="text-fg-muted">{t('error.notFoundBody')}</p>
        <Button asChild>
          <Link to="/">{t('error.goHome')}</Link>
        </Button>
      </div>
    </div>
  );
}
