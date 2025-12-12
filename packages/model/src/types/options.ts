import type { SupabaseClient } from '@supabase/supabase-js';
import type { UUID } from 'node:crypto';

export type ReadOptions = {
  supabase?: SupabaseClient;
  signal?: AbortSignal;
};

export type WriteOptions = {
  supabase?: SupabaseClient;
  by?: { id: UUID };
};
