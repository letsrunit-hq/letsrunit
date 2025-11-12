import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient;

export function connect() {
  client ??= createClient(process.env.SUPABASE_URL || 'http://127.0.0.1:54321', process.env.SUPABASE_KEY || 'letsrunit');

  return client;
}
