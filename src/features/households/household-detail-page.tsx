import { Crown, Link2, LogOut, Pencil, Share2, Trash2, UserMinus, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router';
import { PageHeader } from '@/components/shared/page-header';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { useCurrentUser } from '@/features/auth/auth-context';
import { errorMessage } from '@/lib/supabase/errors';
import { formatDate } from '@/lib/utils/format';
import { useActiveHousehold } from './active-household';
import { invitationUrl, type HouseholdMember, type MyHousehold } from './api';
import {
  useCreateInvitation,
  useDeleteHousehold,
  useHouseholdMembers,
  useLeaveHousehold,
  usePendingInvitations,
  useRemoveMember,
  useRenameHousehold,
  useRevokeInvitation,
  useTransferOwnership,
} from './hooks';

type PendingAction =
  | { type: 'remove'; member: HouseholdMember }
  | { type: 'transfer'; member: HouseholdMember }
  | { type: 'revoke'; invitationId: string }
  | { type: 'leave' }
  | { type: 'delete' }
  | null;

export function HouseholdDetailPage() {
  const { householdId = '' } = useParams();
  const { households } = useActiveHousehold();
  const household = households.find((h) => h.id === householdId);
  if (!household) return <Navigate to="/households" replace />;
  return <HouseholdDetail household={household} />;
}

function HouseholdDetail({ household }: { household: MyHousehold }) {
  const { t, i18n } = useTranslation(['households', 'common', 'errors']);
  const user = useCurrentUser();
  const toast = useToast();
  const navigate = useNavigate();
  const isOwner = household.role === 'owner';
  const members = useHouseholdMembers(household.id);
  const invitations = usePendingInvitations(household.id);
  const rename = useRenameHousehold(household.id);
  const createInvitation = useCreateInvitation(household.id);
  const revokeInvitation = useRevokeInvitation(household.id);
  const removeMember = useRemoveMember(household.id);
  const transfer = useTransferOwnership(household.id);
  const leave = useLeaveHousehold();
  const remove = useDeleteHousehold();

  const [renameOpen, setRenameOpen] = useState(false);
  const [newName, setNewName] = useState(household.name);
  const [invite, setInvite] = useState<{ url: string; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState<PendingAction>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const ownerCount = members.data?.filter((m) => m.role === 'owner').length ?? 0;
  const isLastOwner = isOwner && ownerCount <= 1;
  const date = (value: string) => formatDate(value, i18n.language);

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      toast.show(success);
    } catch (error) {
      toast.show(errorMessage(error), 'error');
      throw error;
    }
  }

  async function onCreateInvitation() {
    try {
      const result = await createInvitation.mutateAsync();
      setInvite({ url: invitationUrl(result.token), expiresAt: result.expiresAt });
      setCopied(false);
    } catch (error) {
      toast.show(errorMessage(error), 'error');
    }
  }

  async function onShare() {
    if (!invite) return;
    const text = t('detail.inviteShareText', { household: household.name });
    if (navigator.share) {
      try {
        await navigator.share({ title: 'QuéComo', text, url: invite.url });
        return;
      } catch {
        // User cancelled the share sheet; fall back to copying.
      }
    }
    await navigator.clipboard.writeText(invite.url);
    setCopied(true);
  }

  return (
    <>
      <PageHeader
        title={household.name}
        subtitle={t(`common:roles.${household.role}`)}
        backTo="/households"
        actions={
          isOwner ? (
            <Button variant="outline" onClick={() => setRenameOpen(true)}>
              <Pencil aria-hidden="true" />
              {t('detail.rename')}
            </Button>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl">{t('detail.members')}</h2>
            <Button
              size="sm"
              onClick={() => void onCreateInvitation()}
              loading={createInvitation.isPending}
            >
              <UserPlus aria-hidden="true" />
              {t('detail.invite')}
            </Button>
          </div>
          {members.isPending ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          ) : members.isError ? (
            <Alert tone="error">{errorMessage(members.error)}</Alert>
          ) : (
            <ul className="divide-border/70 flex flex-col divide-y">
              {members.data.map((member) => {
                const isMe = member.userId === user.id;
                return (
                  <li key={member.userId} className="flex flex-wrap items-center gap-3 py-3">
                    <span
                      aria-hidden="true"
                      className="bg-accent-soft font-display text-accent-strong grid size-11 shrink-0 place-items-center rounded-full text-lg font-semibold"
                    >
                      {member.displayName.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {member.displayName}
                        {isMe && (
                          <span className="text-fg-muted font-normal"> · {t('detail.you')}</span>
                        )}
                      </span>
                      <span className="text-fg-muted flex items-center gap-1 text-sm">
                        {member.role === 'owner' && (
                          <Crown aria-hidden="true" className="size-3.5" />
                        )}
                        {t(`common:roles.${member.role}`)}
                      </span>
                    </span>
                    {isOwner && !isMe && (
                      <span className="flex gap-1">
                        {member.role !== 'owner' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`${t('detail.makeOwner')}: ${member.displayName}`}
                            title={t('detail.makeOwner')}
                            onClick={() => setPending({ type: 'transfer', member })}
                          >
                            <Crown aria-hidden="true" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="dangerGhost"
                          aria-label={`${t('detail.remove')}: ${member.displayName}`}
                          title={t('detail.remove')}
                          onClick={() => setPending({ type: 'remove', member })}
                        >
                          <UserMinus aria-hidden="true" />
                        </Button>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="text-2xl">{t('detail.invitations')}</h2>
          {invitations.isPending ? (
            <Skeleton className="h-14" />
          ) : invitations.isError ? (
            <Alert tone="error">{errorMessage(invitations.error)}</Alert>
          ) : invitations.data.length === 0 ? (
            <p className="text-fg-muted">{t('detail.noInvitations')}</p>
          ) : (
            <ul className="divide-border/70 flex flex-col divide-y">
              {invitations.data.map((invitation) => (
                <li key={invitation.id} className="flex items-center gap-3 py-3">
                  <Link2 aria-hidden="true" className="text-fg-muted size-5 shrink-0" />
                  <span className="flex-1 text-sm">
                    {t('detail.inviteCreated', {
                      date: date(invitation.created_at),
                      expires: date(invitation.expires_at),
                    })}
                  </span>
                  {(isOwner || invitation.invited_by === user.id) && (
                    <Button
                      size="sm"
                      variant="dangerGhost"
                      onClick={() => setPending({ type: 'revoke', invitationId: invitation.id })}
                    >
                      {t('detail.revoke')}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <section className="mt-10 flex flex-col gap-3">
        <h2 className="text-fg-muted font-sans text-sm font-semibold tracking-wide uppercase">
          {t('detail.dangerZone')}
        </h2>
        <Card className="flex flex-col gap-4 shadow-none">
          {isLastOwner && <Alert tone="warning">{t('detail.lastOwnerHint')}</Alert>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              disabled={isLastOwner}
              onClick={() => setPending({ type: 'leave' })}
            >
              <LogOut aria-hidden="true" />
              {t('detail.leave')}
            </Button>
            {isOwner && (
              <Button variant="dangerGhost" onClick={() => setPending({ type: 'delete' })}>
                <Trash2 aria-hidden="true" />
                {t('detail.delete')}
              </Button>
            )}
          </div>
        </Card>
      </section>

      <Dialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        title={t('detail.renameTitle')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenameOpen(false)}>
              {t('common:actions.cancel')}
            </Button>
            <Button
              loading={rename.isPending}
              disabled={!newName.trim() || newName.trim().length > 60}
              onClick={() =>
                void run(() => rename.mutateAsync(newName), t('common:status.saved')).then(() =>
                  setRenameOpen(false),
                )
              }
            >
              {t('common:actions.save')}
            </Button>
          </>
        }
      >
        <Field label={t('onboarding.nameLabel')}>
          <Input
            value={newName}
            maxLength={60}
            onChange={(event) => setNewName(event.target.value)}
          />
        </Field>
      </Dialog>

      <Dialog
        open={invite !== null}
        onOpenChange={(open) => !open && setInvite(null)}
        title={t('detail.inviteTitle', { household: household.name })}
        description={invite ? t('detail.inviteBody', { date: date(invite.expiresAt) }) : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setInvite(null)}>
              {t('common:actions.close')}
            </Button>
            <Button onClick={() => void onShare()}>
              <Share2 aria-hidden="true" />
              {copied ? t('common:actions.copied') : t('common:actions.share')}
            </Button>
          </>
        }
      >
        {invite && (
          <Input
            readOnly
            value={invite.url}
            aria-label={t('onboarding.joinLabel')}
            onFocus={(event) => event.currentTarget.select()}
            className="font-mono text-sm"
          />
        )}
      </Dialog>

      <ConfirmDialog
        open={pending?.type === 'remove'}
        onOpenChange={(open) => !open && setPending(null)}
        title={t('detail.remove')}
        description={
          pending?.type === 'remove'
            ? t('detail.removeConfirm', { name: pending.member.displayName })
            : ''
        }
        confirmLabel={t('detail.remove')}
        onConfirm={() =>
          pending?.type === 'remove'
            ? run(
                () => removeMember.mutateAsync(pending.member.userId),
                t('detail.removed', { name: pending.member.displayName }),
              )
            : undefined
        }
      />
      <ConfirmDialog
        open={pending?.type === 'transfer'}
        onOpenChange={(open) => !open && setPending(null)}
        title={t('detail.makeOwner')}
        tone="primary"
        description={
          pending?.type === 'transfer'
            ? t('detail.transferConfirm', { name: pending.member.displayName })
            : ''
        }
        confirmLabel={t('detail.makeOwner')}
        onConfirm={() =>
          pending?.type === 'transfer'
            ? run(
                () => transfer.mutateAsync(pending.member.userId),
                t('detail.transferred', { name: pending.member.displayName }),
              )
            : undefined
        }
      />
      <ConfirmDialog
        open={pending?.type === 'revoke'}
        onOpenChange={(open) => !open && setPending(null)}
        title={t('detail.revoke')}
        description={t('detail.revokeConfirm')}
        confirmLabel={t('detail.revoke')}
        onConfirm={() =>
          pending?.type === 'revoke'
            ? run(() => revokeInvitation.mutateAsync(pending.invitationId), t('detail.revoked'))
            : undefined
        }
      />
      <ConfirmDialog
        open={pending?.type === 'leave'}
        onOpenChange={(open) => !open && setPending(null)}
        title={t('detail.leave')}
        description={t('detail.leaveConfirm', { household: household.name })}
        confirmLabel={t('detail.leave')}
        onConfirm={() =>
          run(() => leave.mutateAsync(household.id), t('detail.left')).then(() =>
            navigate('/households', { replace: true }),
          )
        }
      />
      <ConfirmDialog
        open={pending?.type === 'delete'}
        onOpenChange={(open) => {
          if (!open) {
            setPending(null);
            setDeleteConfirmText('');
          }
        }}
        title={t('detail.delete')}
        description={t('detail.deleteConfirm', { household: household.name })}
        confirmLabel={t('detail.delete')}
        confirmDisabled={deleteConfirmText.trim() !== household.name}
        onConfirm={() =>
          run(() => remove.mutateAsync(household.id), t('detail.deleted')).then(() =>
            navigate('/households', { replace: true }),
          )
        }
      >
        <Field label={t('detail.deleteTypeName')}>
          <Input
            value={deleteConfirmText}
            onChange={(event) => setDeleteConfirmText(event.target.value)}
          />
        </Field>
      </ConfirmDialog>
    </>
  );
}
