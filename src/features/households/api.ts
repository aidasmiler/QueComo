import { supabase } from '@/lib/supabase/client';
import { AppError, unwrap } from '@/lib/supabase/errors';
import type { Database } from '@/lib/supabase/database.types';

export type Household = Database['public']['Tables']['households']['Row'];
export type HouseholdRole = 'owner' | 'member';
export interface MyHousehold extends Household {
  role: HouseholdRole;
  memberCount: number;
}
export interface HouseholdMember {
  userId: string;
  role: HouseholdRole;
  joinedAt: string;
  displayName: string;
}
export type HouseholdInvitation = Database['public']['Tables']['household_invitations']['Row'];

function asRole(value: string): HouseholdRole {
  return value === 'owner' ? 'owner' : 'member';
}

export async function fetchMyHouseholds(userId: string): Promise<MyHousehold[]> {
  const rows = unwrap(
    await supabase
      .from('household_members')
      .select(
        'role, households!inner(id, name, created_by, created_at, updated_at, household_members(count))',
      )
      .eq('user_id', userId),
  );
  return rows
    .map((row) => {
      const { household_members: counts, ...household } = row.households as Household & {
        household_members: { count: number }[];
      };
      return { ...household, role: asRole(row.role), memberCount: counts[0]?.count ?? 1 };
    })
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function fetchMembers(householdId: string): Promise<HouseholdMember[]> {
  const members = unwrap(
    await supabase
      .from('household_members')
      .select('user_id, role, joined_at')
      .eq('household_id', householdId)
      .order('joined_at'),
  );
  const ids = members.map((m) => m.user_id);
  const profiles = ids.length
    ? unwrap(await supabase.from('profiles').select('id, display_name').in('id', ids))
    : [];
  const names = new Map(profiles.map((p) => [p.id, p.display_name]));
  return members.map((m) => ({
    userId: m.user_id,
    role: asRole(m.role),
    joinedAt: m.joined_at,
    displayName: names.get(m.user_id) ?? '—',
  }));
}

export async function fetchPendingInvitations(householdId: string): Promise<HouseholdInvitation[]> {
  return unwrap(
    await supabase
      .from('household_invitations')
      .select('*')
      .eq('household_id', householdId)
      .is('accepted_at', null)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false }),
  );
}

export async function createHousehold(name: string): Promise<string> {
  return unwrap(await supabase.rpc('create_household', { p_name: name.trim() }));
}

export async function renameHousehold(householdId: string, name: string) {
  unwrap(await supabase.from('households').update({ name: name.trim() }).eq('id', householdId));
}

export async function createInvitation(householdId: string) {
  const rows = unwrap(
    await supabase.rpc('create_household_invitation', { p_household_id: householdId }),
  );
  const row = rows[0];
  if (!row) throw new AppError('unknown', null, 'Invitation was not created');
  return { id: row.invitation_id, token: row.token, expiresAt: row.expires_at };
}

export async function fetchInvitationPreview(token: string) {
  const rows = unwrap(await supabase.rpc('get_invitation_preview', { p_token: token }));
  const row = rows[0];
  if (!row) throw new AppError('server', 'QC_INVITATION_INVALID', 'QC_INVITATION_INVALID');
  return {
    householdName: row.household_name,
    invitedByName: row.invited_by_name as string | null,
    status: row.status as 'pending' | 'accepted' | 'revoked' | 'expired',
    alreadyMember: row.already_member,
  };
}

export async function acceptInvitation(token: string): Promise<string> {
  return unwrap(await supabase.rpc('accept_household_invitation', { p_token: token }));
}

export async function revokeInvitation(invitationId: string) {
  unwrap(await supabase.rpc('revoke_household_invitation', { p_invitation_id: invitationId }));
}

export async function leaveHousehold(householdId: string) {
  unwrap(await supabase.rpc('leave_household', { p_household_id: householdId }));
}

export async function removeMember(householdId: string, userId: string) {
  unwrap(
    await supabase.rpc('remove_household_member', {
      p_household_id: householdId,
      p_user_id: userId,
    }),
  );
}

export async function transferOwnership(householdId: string, newOwnerId: string) {
  unwrap(
    await supabase.rpc('transfer_household_ownership', {
      p_household_id: householdId,
      p_new_owner: newOwnerId,
    }),
  );
}

export async function deleteHousehold(householdId: string) {
  unwrap(await supabase.rpc('delete_household', { p_household_id: householdId }));
}

export function invitationUrl(token: string) {
  return `${window.location.origin}/invite/${token}`;
}
