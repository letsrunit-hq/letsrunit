import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { connect as supabase } from '@/libs/supabase/browser';
import { type Data, fromData, type Journal, journalFromData, type Run, RunSchema } from '@letsrunit/model';
import type { UUID } from 'node:crypto';

export interface UseRunOptions {
  client?: SupabaseClient;
}

export function useRun(id: string | undefined, opts: UseRunOptions = {}) {
  // Client will be resolved lazily in effect to avoid throwing during SSR/tests without env
  const injectedClient = opts.client;
  const [run, setRun] = useState<Run | null>(null);
  const [journal, setJournal] = useState<Journal | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let isActive = true;
    setLoading(true);
    setError(null);

    let client: SupabaseClient | null = null;

    function resolveClient(): SupabaseClient | null {
      if (injectedClient) return injectedClient;
      try {
        return supabase();
      } catch (e: any) {
        setError(e?.message ?? String(e));
        return null;
      }
    }

    client = resolveClient();
    if (!client) {
      setLoading(false);
      return () => {
        isActive = false;
      };
    }

    async function fetchRun() {
      const { data, error: e } = await client!.from('runs').select('*').eq('id', id).single();

      if (e) setError(e.message);
      else setRun(data as unknown as Run);
    }

    async function fetchJournal(): Promise<Journal | undefined> {
      const { data, error: e } = await client!
        .from('journal_entries')
        .select('*')
        .eq('run_id', id)
        .order('created_at', { ascending: true });

      if (e) throw e;
      return journalFromData(id as UUID, data);
    }

    Promise.all([fetchRun(), fetchJournal()])
      .catch((e) => setError(e?.message ?? String(e)))
      .finally(() => isActive && setLoading(false));

    const channel = client.channel(`realtime:run:${id}`);

    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'runs', filter: `id=eq.${id}` }, (payload) =>
      fromData(RunSchema)(payload as unknown as Data<Run>),
    );

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'journal_entries', filter: `run_id=eq.${id}` },
      async () => {
        try {
          const journal = await fetchJournal();
          if (journal && isActive) setJournal(journal);
        } catch (e: any) {
          setError(e?.message ?? String(e));
        }
      },
    );

    channel.subscribe();

    return () => {
      isActive = false;
      try {
        client?.removeChannel(channel);
      } catch {
        // ignore
      }
    };
  }, [injectedClient, id]);

  return { run, journal, loading, error };
}

export default useRun;
