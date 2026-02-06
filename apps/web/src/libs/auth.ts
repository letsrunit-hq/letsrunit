import type { Provider, SupabaseClient, User } from '@supabase/supabase-js';
import { connect as supabase } from './supabase/browser';

export async function isLoggedIn(opts: { supabase?: SupabaseClient } = {}): Promise<boolean | 'anonymous'> {
  const client = opts.supabase ?? supabase();

  const { data } = await client.auth.getUser();

  if (!data.user) return false;
  if (data.user.is_anonymous) return 'anonymous';
  return true;
}

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

export async function login(params: { email: string; password: string }, opts: { supabase?: SupabaseClient } = {}) {
  const client = opts.supabase ?? supabase();

  const {
    data: { user },
  } = await client.auth.getUser();
  if (user && !user.is_anonymous) {
    throw new Error('Already signed in');
  }

  const { error } = await client.auth.signInWithPassword(params);
  if (error) throw error;
}

export async function signup(
  params: { email: string; password: string; name: string },
  opts: { supabase?: SupabaseClient } = {},
) {
  const client = opts.supabase ?? supabase();

  const {
    data: { user },
  } = await client.auth.getUser();

  if (user && !user.is_anonymous) {
    throw new Error('Already signed in');
  }

  if (user?.is_anonymous) {
    const { error } = await client.auth.updateUser({
      email: params.email,
      password: params.password,
      data: { full_name: params.name },
    });
    if (error) throw error;
  } else {
    const { error } = await client.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: { full_name: params.name },
      },
    });
    if (error) throw error;
  }
}

export async function loginWithOAuth(
  params: { provider: Provider; redirectTo?: string },
  opts: { supabase?: SupabaseClient } = {},
) {
  const client = opts.supabase ?? supabase();

  const {
    data: { user },
  } = await client.auth.getUser();

  if (user && !user.is_anonymous) {
    throw new Error('Already signed in');
  }

  if (user?.is_anonymous) {
    const { error } = await client.auth.linkIdentity({
      provider: params.provider,
      options: {
        redirectTo: params.redirectTo,
      },
    });
    if (error) throw error;
  } else {
    const { error } = await client.auth.signInWithOAuth({
      provider: params.provider,
      options: {
        redirectTo: params.redirectTo,
      },
    });
    if (error) throw error;
  }
}

export async function linkIdentity(
  params: { provider: Provider; redirectTo?: string },
  opts: { supabase?: SupabaseClient } = {},
) {
  const client = opts.supabase ?? supabase();

  const { error } = await client.auth.linkIdentity({
    provider: params.provider,
    options: {
      redirectTo: params.redirectTo,
    },
  });
  if (error) throw error;
}

export async function logout(opts: { supabase?: SupabaseClient } = {}) {
  const client = opts.supabase ?? supabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}
