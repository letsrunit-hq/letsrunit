import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient;

export function connect(): SupabaseClient {
  client ??= createClient(
    process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY
      || process.env.SUPABASE_ANON_KEY
      || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dev-local.eyJyb2xlIjoiYW5vbiJ9',
  );

  return client;
}
