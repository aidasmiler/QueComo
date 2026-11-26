import { zodResolver } from '@hookform/resolvers/zod';
import { Link2, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { Logo } from '@/components/layout/logo';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { parseInvitationInput } from '@/features/auth/pending-invitation';
import { useProfile } from '@/features/profile/hooks';
import { errorMessage } from '@/lib/supabase/errors';
import { useActiveHousehold } from './active-household';
import { useCreateHousehold } from './hooks';

const householdSchema = z.object({ name: z.string().trim().min(1).max(60) });

export function OnboardingPage() {
  const { t } = useTranslation(['households', 'common', 'errors']);
  const navigate = useNavigate();
  const profile = useProfile();
  const { households, setActiveId } = useActiveHousehold();
  const createHousehold = useCreateHousehold();
  const [joinValue, setJoinValue] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof householdSchema>>({
    resolver: zodResolver(householdSchema),
    defaultValues: { name: '' },
  });

  const onCreate = form.handleSubmit(async ({ name }) => {
    const id = await createHousehold.mutateAsync(name);
    setActiveId(id);
    void navigate('/', { replace: true });
  });

  function onJoin(event: React.FormEvent) {
    event.preventDefault();
    const token = parseInvitationInput(joinValue);
    if (!token) return setJoinError(t('onboarding.joinInvalid'));
    void navigate(`/invite/${token}`);
  }

  return (
    <div className="bg-bg pt-safe pb-safe min-h-dvh px-5">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 py-8">
        <Logo />
        <div>
          <h1 className="text-4xl">
            {profile.data
              ? `${t('onboarding.title')}, ${profile.data.display_name}`
              : t('onboarding.title')}
          </h1>
          <p className="text-fg-muted mt-2">{t('onboarding.subtitle')}</p>
        </div>

        <Card>
          <form onSubmit={onCreate} className="flex flex-col gap-4" noValidate>
            <div className="flex items-center gap-3">
              <span className="bg-primary-soft text-primary grid size-10 place-items-center rounded-full">
                <Plus aria-hidden="true" className="size-5" />
              </span>
              <h2 className="text-2xl">{t('onboarding.createTitle')}</h2>
            </div>
            {createHousehold.isError && (
              <Alert tone="error">{errorMessage(createHousehold.error)}</Alert>
            )}
            <Field
              label={t('onboarding.nameLabel')}
              hint={t('onboarding.createHint')}
              error={form.formState.errors.name ? t('errors:QC_INVALID_NAME') : undefined}
            >
              <Input
                placeholder={t('onboarding.namePlaceholder')}
                maxLength={60}
                {...form.register('name')}
              />
            </Field>
            <Button type="submit" size="lg" loading={createHousehold.isPending}>
              {t('onboarding.create')}
            </Button>
          </form>
        </Card>

        <Card className="bg-surface-muted/60 shadow-none">
          <form onSubmit={onJoin} className="flex flex-col gap-4" noValidate>
            <div className="flex items-center gap-3">
              <span className="bg-accent-soft text-accent-strong grid size-10 place-items-center rounded-full">
                <Link2 aria-hidden="true" className="size-5" />
              </span>
              <h2 className="text-2xl">{t('onboarding.joinTitle')}</h2>
            </div>
            <Field
              label={t('onboarding.joinLabel')}
              hint={t('onboarding.joinHint')}
              error={joinError ?? undefined}
            >
              <Input
                value={joinValue}
                onChange={(event) => {
                  setJoinValue(event.target.value);
                  setJoinError(null);
                }}
                inputMode="url"
                autoComplete="off"
              />
            </Field>
            <Button type="submit" variant="outline">
              {t('onboarding.join')}
            </Button>
          </form>
        </Card>

        {households.length > 0 && (
          <Button variant="ghost" onClick={() => void navigate(-1)}>
            {t('common:actions.back')}
          </Button>
        )}
      </div>
    </div>
  );
}
