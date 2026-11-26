import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBrowserOnline } from '@/hooks/use-browser-online';

export function ConnectionBanner() {
  const { t } = useTranslation();
  const online = useBrowserOnline();
  if (online) return null;
  return (
    <div
      role="status"
      className="bg-charcoal-900 text-cream-50 flex items-center gap-2 px-4 py-2 text-sm"
    >
      <WifiOff aria-hidden="true" className="size-4 shrink-0" />
      <span>
        <strong className="font-semibold">{t('status.offline')}.</strong>{' '}
        {t('status.offlineDetail')}
      </span>
    </div>
  );
}
