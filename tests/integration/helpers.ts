/** Shared helpers for integration tests against the TEST Supabase project (never production). */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

export const enabled = import.meta.env.MODE === 'integration';
export const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
export const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ?? '';
export const TEST_PROJECT = 'hbdcxaynxkaidqdsqdqv';

export type Client = SupabaseClient<Database>;

export async function newUser(label: string): Promise<{ client: Client; id: string }> {
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
