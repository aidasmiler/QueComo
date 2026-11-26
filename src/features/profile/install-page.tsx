import { CheckCircle2, Download, Laptop, Smartphone, TabletSmartphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/shared/page-header';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { detectPlatform, isStandalone, type Platform } from './platform';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPage() {
  const { t } = useTranslation('profile');
  const [platform] = useState<Platform>(() =>
    detectPlatform(navigator.userAgent, navigator.maxTouchPoints),
  );
  const [installed, setInstalled] = useState(isStandalone);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // Show the current device first, then the others for people helping family members.
  const order: Platform[] = [
    platform,
    ...(['ios', 'android', 'desktop'] as const).filter((p) => p !== platform),
  ];
  const icons = { ios: TabletSmartphone, android: Smartphone, desktop: Laptop };

  return (
    <>
      <PageHeader
        title={t('installGuide.title')}
        subtitle={t('installGuide.intro')}
        backTo="/profile"
      />
      <div className="flex max-w-2xl flex-col gap-4">
        {installed && (
          <Alert>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 aria-hidden="true" className="size-4" />
              {t('installGuide.installed')}
            </span>
          </Alert>
        )}
        {deferred && !installed && (
          <Button
            size="lg"
            onClick={() => {
              void deferred.prompt();
              void deferred.userChoice.then(() => setDeferred(null));
            }}
          >
            <Download aria-hidden="true" />
            {t('installGuide.installButton')}
          </Button>
        )}
        {order.map((p, index) => {
          const Icon = icons[p];
          const steps = t(`installGuide.${p}.steps`, { returnObjects: true }) as string[];
          return (
            <Card key={p} className={index === 0 ? 'border-primary/40' : 'shadow-none'}>
              <h2 className="flex items-center gap-2 text-xl">
                <Icon aria-hidden="true" className="text-primary size-5" />
                {t(`installGuide.${p}.title`)}
              </h2>
              <ol className="text-fg-muted marker:text-primary mt-3 flex list-decimal flex-col gap-2 pl-5 marker:font-semibold">
                {steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </Card>
          );
        })}
      </div>
    </>
  );
}
