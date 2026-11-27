/**
 * Security tests against the shared TEST Supabase project with real user identities (no service
 * role). Run with `npm run test:integration`; requires email confirmation disabled in that project.
 * They never touch production: the URL must be the test project.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '@/lib/supabase/database.types';

const enabled = import.meta.env.MODE === 'integration';
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ?? '';
const TEST_PROJECT = 'hbdcxaynxkaidqdsqdqv';

type Client = SupabaseClient<Database>;

async function newUser(label: string): Promise<{ client: Client; id: string }> {
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const email = `qc-it-${label}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}@example.com`;
  const { data, error } = await client.auth.signUp({
    email,
    password: 'quecomo-it-Passw0rd',
    options: { data: { display_name: `IT ${label}` } },
  });
  if (error) throw error;
  if (!data.session || !data.user)
    throw new Error('Email confirmation must be disabled in the test project');
  return { client, id: data.user.id };
}

describe.skipIf(!enabled)('households RLS and RPCs (test project)', () => {
  let a: { client: Client; id: string };
  let b: { client: Client; id: string };
  let c: { client: Client; id: string };
  let householdA: string;
  let householdC: string;

  beforeAll(async () => {
    expect(url).toContain(TEST_PROJECT);
    [a, b, c] = await Promise.all([newUser('a'), newUser('b'), newUser('c')]);
    householdA = (await a.client.rpc('create_household', { p_name: 'Hogar A' })).data!;
    householdC = (await c.client.rpc('create_household', { p_name: 'Hogar C' })).data!;
    expect(householdA).toBeTruthy();
    expect(householdC).toBeTruthy();
  }, 30_000);

  it('anonymous users cannot read anything', async () => {
    const anon = createClient<Database>(url, key, { auth: { persistSession: false } });
    const { data: households } = await anon.from('households').select('id');
    expect(households ?? []).toHaveLength(0);
    const { error } = await anon.rpc('create_household', { p_name: 'Nope' });
    expect(error).not.toBeNull();
  });

  it('users only see their own households, members and profiles', async () => {
    const { data } = await c.client.from('households').select('id');
    expect(data?.map((h) => h.id)).toEqual([householdC]);
    const members = await c.client
      .from('household_members')
      .select('*')
      .eq('household_id', householdA);
    expect(members.data).toHaveLength(0);
    const profile = await c.client.from('profiles').select('id').eq('id', a.id);
    expect(profile.data).toHaveLength(0);
  });

  it('nobody can insert memberships or change roles directly', async () => {
    const insert = await c.client
      .from('household_members')
      .insert({ household_id: householdA, user_id: c.id, role: 'owner' } as never);
    expect(insert.error).not.toBeNull();
    const update = await a.client
      .from('household_members')
      .update({ role: 'member' } as never)
      .eq('household_id', householdA);
    expect(update.error).not.toBeNull();
  });

  it('outsiders cannot rename, invite to, or delete another household', async () => {
    const rename = await c.client
      .from('households')
      .update({ name: 'Hacked' })
      .eq('id', householdA)
      .select();
    expect(rename.data ?? []).toHaveLength(0);
    const invite = await c.client.rpc('create_household_invitation', {
      p_household_id: householdA,
    });
    expect(invite.error?.message).toContain('QC_FORBIDDEN');
    const del = await c.client.rpc('delete_household', { p_household_id: householdA });
    expect(del.error?.message).toContain('QC_NOT_OWNER');
  });

  it('invitations are single-use, revocable and validated server-side', async () => {
    const invalid = await b.client.rpc('accept_household_invitation', {
      p_token: 'not-a-real-token-123456',
    });
    expect(invalid.error?.message).toContain('QC_INVITATION_INVALID');

    const revokedInv = (
      await a.client.rpc('create_household_invitation', { p_household_id: householdA })
    ).data![0]!;
    await a.client.rpc('revoke_household_invitation', {
      p_invitation_id: revokedInv.invitation_id,
    });
    const revoked = await b.client.rpc('accept_household_invitation', {
      p_token: revokedInv.token,
    });
    expect(revoked.error?.message).toContain('QC_INVITATION_REVOKED');

    const inv = (await a.client.rpc('create_household_invitation', { p_household_id: householdA }))
      .data![0]!;
    // Only the hash is stored: the token itself is never readable from the table.
    const stored = await a.client
      .from('household_invitations')
      .select('token_hash')
      .eq('id', inv.invitation_id)
      .single();
    expect(stored.data?.token_hash).not.toBe(inv.token);

    const accepted = await b.client.rpc('accept_household_invitation', { p_token: inv.token });
    expect(accepted.data).toBe(householdA);
    const reused = await c.client.rpc('accept_household_invitation', { p_token: inv.token });
    expect(reused.error?.message).toContain('QC_INVITATION_USED');

    const members = await b.client
      .from('household_members')
      .select('user_id, role')
      .eq('household_id', householdA);
    expect(members.data).toHaveLength(2);
    expect(members.data?.find((m) => m.user_id === b.id)?.role).toBe('member');
  });

  it('members cannot manage members; owners cannot leave as last owner; transfer works', async () => {
    const remove = await b.client.rpc('remove_household_member', {
      p_household_id: householdA,
      p_user_id: a.id,
    });
    expect(remove.error?.message).toContain('QC_NOT_OWNER');

    const leaveOwner = await a.client.rpc('leave_household', { p_household_id: householdA });
    expect(leaveOwner.error?.message).toContain('QC_LAST_OWNER');

    const transfer = await a.client.rpc('transfer_household_ownership', {
      p_household_id: householdA,
      p_new_owner: b.id,
    });
    expect(transfer.error).toBeNull();
    const roles = await a.client
      .from('household_members')
      .select('user_id, role')
      .eq('household_id', householdA);
    expect(roles.data?.find((m) => m.user_id === b.id)?.role).toBe('owner');
    expect(roles.data?.find((m) => m.user_id === a.id)?.role).toBe('member');

    const leave = await a.client.rpc('leave_household', { p_household_id: householdA });
    expect(leave.error).toBeNull();
    const after = await a.client.from('households').select('id').eq('id', householdA);
    expect(after.data).toHaveLength(0);
  });

  it('dietary preferences are private to each user', async () => {
    const add = await b.client
      .from('user_dietary_preferences')
      .insert({ preset_key: 'vegetarian', kind: 'restriction' });
    expect(add.error).toBeNull();
    const spoof = await c.client
      .from('user_dietary_preferences')
      .insert({ preset_key: 'vegan', kind: 'restriction', user_id: b.id });
    expect(spoof.error).not.toBeNull();
    const peek = await c.client.from('user_dietary_preferences').select('*').eq('user_id', b.id);
    expect(peek.data).toHaveLength(0);
  });

  it('profiles reject unsupported locales and other users cannot edit them', async () => {
    const bad = await b.client.from('profiles').update({ locale: 'fr-FR' }).eq('id', b.id);
    expect(bad.error).not.toBeNull();
    const ok = await b.client
      .from('profiles')
      .update({ locale: 'en-GB' })
      .eq('id', b.id)
      .select()
      .single();
    expect(ok.data?.locale).toBe('en-GB');
    const other = await c.client
      .from('profiles')
      .update({ display_name: 'X' })
      .eq('id', b.id)
      .select();
    expect(other.data ?? []).toHaveLength(0);
  });
});
