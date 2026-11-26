import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import type { z } from 'zod';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { matchLocale } from '@/i18n/locale';
import { supabase } from '@/lib/supabase/client';
import { errorMessage } from '@/lib/supabase/errors';
import { useAuth } from './auth-context';
import { AuthLayout } from './auth-layout';
import { peekPendingInvitation } from './pending-invitation';
import {
  NAME_MAX,
  PASSWORD_MIN,
  forgotSchema,
  resetSchema,
  signInSchema,
  signUpSchema,
} from './schemas';

function useValidationMessage() {
  const { t } = useTranslation('auth');
  return (message?: string) =>
    message
      ? t(message as 'validation.emailInvalid', {
          count: message.endsWith('Max') ? NAME_MAX : PASSWORD_MIN,
        })
      : undefined;
}

function redirectUrl(path: string) {
  return `${window.location.origin}${path}`;
}

export function SignInPage() {
  const { t } = useTranslation('auth');
  const tv = useValidationMessage();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof signInSchema>>({ resolver: zodResolver(signInSchema) });
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword(values);
    if (authError) return setError(errorMessage(authError));
    void navigate(from, { replace: true });
  });

  return (
    <AuthLayout title={t('signIn.title')} subtitle={t('signIn.subtitle')}>
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        <Field label={t('fields.email')} error={tv(form.formState.errors.email?.message)}>
          <Input type="email" autoComplete="email" inputMode="email" {...form.register('email')} />
        </Field>
        <Field label={t('fields.password')} error={tv(form.formState.errors.password?.message)}>
          <Input type="password" autoComplete="current-password" {...form.register('password')} />
        </Field>
        <Link
          to="/forgot-password"
          className="text-primary -mt-2 self-end text-sm font-semibold underline-offset-4 hover:underline"
        >
          {t('signIn.forgot')}
        </Link>
        <Button type="submit" size="lg" block loading={form.formState.isSubmitting}>
          {t('signIn.submit')}
        </Button>
        <p className="text-fg-muted text-center text-sm">
          {t('signIn.noAccount')}{' '}
          <Link
            to="/signup"
            className="text-primary font-semibold underline-offset-4 hover:underline"
          >
            {t('signIn.toSignUp')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export function SignUpPage() {
  const { t, i18n } = useTranslation('auth');
  const tv = useValidationMessage();
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof signUpSchema>>({ resolver: zodResolver(signUpSchema) });
  const hasInvitation = Boolean(peekPendingInvitation());

  const onSubmit = form.handleSubmit(async ({ displayName, email, password }) => {
    setError(null);
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl('/auth/callback'),
        // The language chosen before signing up becomes the profile language (validated in SQL).
        data: { display_name: displayName, locale: matchLocale(i18n.language) },
      },
    });
    if (authError) return setError(errorMessage(authError));
    // With email confirmation disabled Supabase returns a session straight away.
    if (data.session) return void navigate('/', { replace: true });
    // An existing confirmed email returns a user without identities (no email is sent).
    if (data.user && data.user.identities?.length === 0) {
      return setError(errorMessage({ code: 'user_already_exists', message: '' }));
    }
    setSentTo(email);
  });

  if (sentTo) {
    return (
      <AuthLayout title={t('signUp.checkEmailTitle')}>
        <div className="flex flex-col items-start gap-4">
          <span className="bg-primary-soft text-primary grid size-14 place-items-center rounded-full">
            <MailCheck aria-hidden="true" className="size-7" />
          </span>
          <p className="text-fg-muted">{t('signUp.checkEmailBody', { email: sentTo })}</p>
          <Button variant="outline" asChild>
            <Link to="/login">{t('signUp.toSignIn')}</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t('signUp.title')} subtitle={t('signUp.subtitle')}>
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        {hasInvitation && <Alert>{t('signUp.invitationNotice')}</Alert>}
        {error && <Alert tone="error">{error}</Alert>}
        <Field
          label={t('fields.displayName')}
          hint={t('fields.displayNameHint')}
          error={tv(form.formState.errors.displayName?.message)}
        >
          <Input autoComplete="given-name" maxLength={NAME_MAX} {...form.register('displayName')} />
        </Field>
        <Field label={t('fields.email')} error={tv(form.formState.errors.email?.message)}>
          <Input type="email" autoComplete="email" inputMode="email" {...form.register('email')} />
        </Field>
        <Field
          label={t('fields.password')}
          hint={t('validation.passwordMin', { count: PASSWORD_MIN })}
          error={tv(form.formState.errors.password?.message)}
        >
          <Input type="password" autoComplete="new-password" {...form.register('password')} />
        </Field>
        <Button type="submit" size="lg" block loading={form.formState.isSubmitting}>
          {t('signUp.submit')}
        </Button>
        <p className="text-fg-muted text-center text-sm">
          {t('signUp.haveAccount')}{' '}
          <Link
            to="/login"
            className="text-primary font-semibold underline-offset-4 hover:underline"
          >
            {t('signUp.toSignIn')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export function ForgotPasswordPage() {
  const { t } = useTranslation('auth');
  const tv = useValidationMessage();
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<z.infer<typeof forgotSchema>>({ resolver: zodResolver(forgotSchema) });

  const onSubmit = form.handleSubmit(async ({ email }) => {
    setError(null);
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl('/reset-password'),
    });
    if (authError) return setError(errorMessage(authError));
    setSentTo(email);
  });

  return (
    <AuthLayout title={t('forgot.title')} subtitle={sentTo ? undefined : t('forgot.subtitle')}>
      {sentTo ? (
        <div className="flex flex-col gap-4">
          <Alert>{t('forgot.sentBody', { email: sentTo })}</Alert>
          <Button variant="outline" asChild>
            <Link to="/login">{t('forgot.back')}</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
          {error && <Alert tone="error">{error}</Alert>}
          <Field label={t('fields.email')} error={tv(form.formState.errors.email?.message)}>
            <Input
              type="email"
              autoComplete="email"
              inputMode="email"
              {...form.register('email')}
            />
          </Field>
          <Button type="submit" size="lg" block loading={form.formState.isSubmitting}>
            {t('forgot.submit')}
          </Button>
          <Link
            to="/login"
            className="text-primary text-center text-sm font-semibold underline-offset-4 hover:underline"
          >
            {t('forgot.back')}
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}

export function ResetPasswordPage() {
  const { t } = useTranslation('auth');
  const tv = useValidationMessage();
  const { session, loading, clearRecovering } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) });

  const onSubmit = form.handleSubmit(async ({ password }) => {
    setError(null);
    const { error: authError } = await supabase.auth.updateUser({ password });
    if (authError) return setError(errorMessage(authError));
    clearRecovering();
    void navigate('/', { replace: true, state: { toast: t('reset.done') } });
  });

  if (loading) return <FullPageSpinner />;

  return (
    <AuthLayout title={t('reset.title')} subtitle={session ? t('reset.subtitle') : undefined}>
      {!session ? (
        <div className="flex flex-col gap-4">
          <Alert tone="error">{t('reset.noSession')}</Alert>
          <Button variant="outline" asChild>
            <Link to="/forgot-password">{t('forgot.submit')}</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
          {error && <Alert tone="error">{error}</Alert>}
          <Field
            label={t('fields.newPassword')}
            error={tv(form.formState.errors.password?.message)}
          >
            <Input type="password" autoComplete="new-password" {...form.register('password')} />
          </Field>
          <Button type="submit" size="lg" block loading={form.formState.isSubmitting}>
            {t('reset.submit')}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

/** Landing page for email confirmation links. supabase-js exchanges the PKCE code automatically. */
export function AuthCallbackPage() {
  const { t } = useTranslation('auth');
  const { session, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);
  const failed =
    new URLSearchParams(window.location.search).has('error') ||
    new URLSearchParams(window.location.hash.slice(1)).has('error');

  useEffect(() => {
    const id = window.setTimeout(() => setTimedOut(true), 8000);
    return () => window.clearTimeout(id);
  }, []);

  if (session) return <Navigate to="/" replace />;
  if (failed || (!loading && timedOut)) {
    return (
      <AuthLayout title={t('signIn.title')}>
        <div className="flex flex-col gap-4">
          <Alert tone="error">{t('callback.failed')}</Alert>
          <Button asChild>
            <Link to="/login">{t('signIn.submit')}</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }
  return <FullPageSpinner label={t('callback.working')} />;
}

export function FullPageSpinner({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div className="bg-bg grid min-h-dvh place-items-center" role="status">
      <div className="text-primary flex flex-col items-center gap-3">
        <Spinner className="size-8" />
        <span className="text-fg-muted text-sm">{label ?? t('status.loading')}</span>
      </div>
    </div>
  );
}
