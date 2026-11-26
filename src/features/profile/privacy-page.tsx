import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';

export function PrivacyPage() {
  const { t } = useTranslation('profile');
  return (
    <>
      <PageHeader title={t('privacyPage.title')} backTo="/profile" />
      <Card className="text-fg-muted flex max-w-2xl flex-col gap-3">
        <p>{t('privacyPage.body1')}</p>
        <p>{t('privacyPage.body2')}</p>
        <p>{t('privacyPage.body3')}</p>
      </Card>
    </>
  );
}
