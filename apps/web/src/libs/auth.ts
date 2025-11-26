import type { SupabaseClient, User } from '@supabase/supabase-js';
import { connect as supabase } from './supabase/browser';

export async function ensureSignedIn(opts: { supabase?: SupabaseClient } = {}) {
  const client = opts.supabase ?? supabase();

  const { data } = await client.auth.getUser();

  if (!data.user) {
    const { error } = await client.auth.signInAnonymously();
    if (error) throw error;
  }
}

export async function getUser(opts: { supabase?: SupabaseClient } = {}): Promise<User> {
  const client = opts.supabase ?? supabase();

  const { data } = await client.auth.getUser();
  if (!data.user) throw new Error('Not signed in');

  return data.user;
}
