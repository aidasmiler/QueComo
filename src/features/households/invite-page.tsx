import { CircleAlert, PartyPopper, Users } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-context';
import { AuthLayout } from '@/features/auth/auth-layout';
import { FullPageSpinner } from '@/features/auth/pages';
import { rememberInvitation } from '@/features/auth/pending-invitation';
import { errorMessage } from '@/lib/supabase/errors';
import { useAcceptInvitation, useInvitationPreview } from './hooks';

const ACTIVE_KEY = (userId: string) => `qc.activeHousehold.${userId}`;

export function InvitePage() {
  const { token = '' } = useParams();
  const { session, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  return session ? <AuthedInvite token={token} /> : <GuestInvite token={token} />;
}

function GuestInvite({ token }: { token: string }) {
  const { t } = useTranslation(['households', 'auth']);
  useEffect(() => {
    if (token) rememberInvitation(token);
  }, [token]);
  return (
    <AuthLayout title={t('invite.title')} subtitle={t('auth:signUp.invitationNotice')}>
      <div className="flex flex-col gap-3">
        <Button size="lg" asChild>
          <Link to="/signup">{t('auth:signIn.toSignUp')}</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link to="/login" state={{ from: `/invite/${token}` }}>
            {t('auth:signIn.submit')}
          </Link>
        </Button>
      </div>
    </AuthLayout>
  );
}

function AuthedInvite({ token }: { token: string }) {
  const { t } = useTranslation(['households', 'common']);
  const { user } = useAuth();
  const navigate = useNavigate();
  const preview = useInvitationPreview(token);
  const accept = useAcceptInvitation();

  async function onAccept() {
    const householdId = await accept.mutateAsync(token);
    try {
      if (user) localStorage.setItem(ACTIVE_KEY(user.id), householdId);
    } catch {
      // Non-critical.
    }
    void navigate('/', { replace: true });
  }

  if (preview.isPending) return <FullPageSpinner />;

  if (preview.isError) {
    return (
      <AuthLayout title={t('invite.title')}>
        <div className="flex flex-col gap-4">
          <Alert tone="error">{errorMessage(preview.error)}</Alert>
          <Button variant="outline" asChild>
            <Link to="/">{t('common:error.goHome')}</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  const { householdName, invitedByName, status, alreadyMember } = preview.data;
  const blocked = status !== 'pending' || alreadyMember;

  return (
    <AuthLayout title={t('invite.title')}>
      <div className="flex flex-col gap-5">
        <div className="bg-primary-soft flex items-center gap-4 rounded-lg p-4">
          <span className="bg-primary text-primary-fg grid size-12 shrink-0 place-items-center rounded-full">
            {blocked ? <CircleAlert aria-hidden="true" /> : <Users aria-hidden="true" />}
          </span>
          <p className="text-olive-900">
            {invitedByName
              ? t('invite.body', { inviter: invitedByName, household: householdName })
              : t('invite.bodyNoInviter', { household: householdName })}
          </p>
        </div>
        {alreadyMember && <Alert>{t('invite.alreadyMember')}</Alert>}
        {!alreadyMember && status !== 'pending' && (
          <Alert tone="warning">
            {t(`invite.status.${status}`)} {t('invite.askNew')}
          </Alert>
        )}
        {accept.isError && <Alert tone="error">{errorMessage(accept.error)}</Alert>}
        {blocked ? (
          <Button size="lg" asChild>
            <Link to="/">{t('invite.goToHousehold')}</Link>
          </Button>
        ) : (
          <Button size="lg" onClick={() => void onAccept()} loading={accept.isPending}>
            <PartyPopper aria-hidden="true" />
            {t('invite.accept')}
          </Button>
        )}
      </div>
    </AuthLayout>
  );
}
