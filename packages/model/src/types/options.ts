import type { User } from '@supabase/auth-js';
import type { SupabaseClient } from '@supabase/supabase-js';

export type ReadOptions = {
  supabase?: SupabaseClient;
  signal?: AbortSignal;
};

export type WriteOptions = {
  supabase?: SupabaseClient;
  by?: Pick<User, 'id'>;
};
