import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { PageHeader } from '@/components/shared/page-header';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { NAME_MAX, nameSchema } from '@/features/auth/schemas';
import { errorMessage } from '@/lib/supabase/errors';
import { useProfile, useUpdateProfile } from './hooks';

const schema = z.object({ displayName: nameSchema });

export function EditProfilePage() {
  const { t } = useTranslation(['profile', 'auth', 'common']);
  const profile = useProfile();
  const update = useUpdateProfile();
  const toast = useToast();
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    values: { displayName: profile.data?.display_name ?? '' },
  });
  const nameError = form.formState.errors.displayName?.message;

  const onSubmit = form.handleSubmit(async ({ displayName }) => {
    await update.mutateAsync({ display_name: displayName });
    toast.show(t('common:status.saved'));
    void navigate('/profile');
  });

  return (
    <>
      <PageHeader title={t('editTitle')} backTo="/profile" />
      <Card className="max-w-xl">
        <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
          {update.isError && <Alert tone="error">{errorMessage(update.error)}</Alert>}
          <Field
            label={t('auth:fields.displayName')}
            hint={t('auth:fields.displayNameHint')}
            error={
              nameError
                ? t(`auth:${nameError as 'validation.nameRequired'}`, { count: NAME_MAX })
                : undefined
            }
          >
            <Input
              autoComplete="given-name"
              maxLength={NAME_MAX}
              {...form.register('displayName')}
            />
          </Field>
          <Button type="submit" loading={update.isPending} className="self-start">
            {t('common:actions.save')}
          </Button>
        </form>
      </Card>
    </>
  );
}
