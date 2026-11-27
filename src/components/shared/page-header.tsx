import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

export function PageHeader({
  title,
  subtitle,
  backTo,
  actions,
}: {
  title: string;
  subtitle?: string;
  backTo?: string;
  actions?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="mb-6 flex flex-col gap-3">
      {backTo && (
        <Link
          to={backTo}
          className="text-fg-muted hover:text-fg -ml-2 inline-flex min-h-11 w-fit items-center gap-1 rounded-full px-2 text-sm font-semibold"
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
          {t('actions.back')}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl break-words sm:text-4xl">{title}</h1>
          {subtitle && <p className="text-fg-muted mt-1">{subtitle}</p>}
        </div>
        {actions}
      </div>
    </div>
  );
}
