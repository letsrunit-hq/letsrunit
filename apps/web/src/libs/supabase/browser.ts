import { type SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

let browserClient: SupabaseClient | undefined;

export function connect(): SupabaseClient {
  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');

    browserClient = createBrowserClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return browserClient;
}
