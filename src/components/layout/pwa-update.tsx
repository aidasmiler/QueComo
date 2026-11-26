import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

/** Asks before activating a new service worker so nothing reloads in the middle of an action. */
export function PwaUpdatePrompt() {
  const { t } = useTranslation();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Check for updates every hour while the app stays open.
      if (registration) window.setInterval(() => void registration.update(), 60 * 60 * 1000);
    },
  });
  if (!needRefresh) return null;
  return (
    <div
      role="status"
      className="bg-charcoal-900 text-cream-50 shadow-float fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[55] mx-auto flex max-w-md items-center gap-3 rounded-lg p-3 pl-4 text-sm lg:bottom-6"
    >
      <span className="flex-1">{t('pwa.updateAvailable')}</span>
      <Button
        size="sm"
        variant="ghost"
        className="text-cream-50 hover:bg-white/10"
        onClick={() => setNeedRefresh(false)}
      >
        {t('actions.close')}
      </Button>
      <Button size="sm" variant="accent" onClick={() => void updateServiceWorker(true)}>
        {t('pwa.update')}
      </Button>
    </div>
  );
}
