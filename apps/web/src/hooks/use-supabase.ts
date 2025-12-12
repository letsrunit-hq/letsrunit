import { connect as supabase } from '@/libs/supabase/browser';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useMemo } from 'react';

export function useSupabase(opts: { client?: SupabaseClient } = {}, setError?: (err: string | null) => void) {
  return useMemo(() => {
    if (opts.client) return opts.client;
    try {
      return supabase();
    } catch (e: any) {
      setError?.(e?.message ?? String(e));
      return null;
    }
  }, [opts.client, setError]);
}

export default useSupabase;
