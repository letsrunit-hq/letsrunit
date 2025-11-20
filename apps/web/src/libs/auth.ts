import { connect as supabase } from './supabase/browser';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function ensureSignedIn(opts: { supabase?: SupabaseClient } = {}) {
  const client = opts.supabase ?? supabase();

  const { data } = await client.auth.getSession();

  console.log(data);

  if (!data.session?.user) {
    const { error } = await client.auth.signInAnonymously();
    if (error) throw error;
  }
}
