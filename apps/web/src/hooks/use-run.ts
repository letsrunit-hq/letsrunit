import { connect as supabase } from '@/libs/supabase/browser';
import { type Data, DBError, fromData, type Journal, journalFromData, type Run, RunSchema } from '@letsrunit/model';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UUID } from 'node:crypto';
import { useEffect, useMemo, useState } from 'react';

export interface UseRunOptions {
  client?: SupabaseClient;
}

export function useRun(input: string | Run | undefined, opts: UseRunOptions = {}) {
  const id = typeof input === 'string' ? input : input?.id;
  const initial = typeof input === 'object' ? input : undefined;

  const injectedClient = opts.client;
  const [run, setRun] = useState<Run | undefined>(initial);
  const [journal, setJournal] = useState<Journal | undefined>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const client = useMemo(() => {
    if (injectedClient) return injectedClient;
    try {
      return supabase();
    } catch (e: any) {
      setError(e?.message ?? String(e));
      return null;
    }
  }, [injectedClient]);

  // Keep state in sync when a full Run object is provided by the caller
  useEffect(() => {
    setRun(initial);
  }, [initial]);

  useEffect(() => {
    if (!id || !client) return;

    let isActive = true;

    async function fetchRun() {
      const { data, status, error } = await client!.from('runs').select('*').eq('id', id).single();
      if (error) throw new DBError(status, error);

      return fromData(RunSchema)(data);
    }

    async function fetchJournal(): Promise<Journal | undefined> {
      const { data, status, error } = await client!
        .from('journal_entries')
        .select('*')
        .eq('run_id', id)
        .order('created_at', { ascending: true });

      if (error) throw new DBError(status, error);

      return journalFromData(id as UUID, data);
    }

    setLoading(true);
    setError(null);

    Promise.all([
      initial ?? fetchRun().then(setRun),
      fetchJournal().then(setJournal),
    ])
      .catch((e) => setError(e?.message ?? String(e)))
      .finally(() => isActive && setLoading(false));

    const channel = client.channel(`realtime:run:${id}`);

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'runs', filter: `id=eq.${id}` },
      (payload) => {
        try {
          const run = fromData(RunSchema)(payload.new as unknown as Data<Run>);
          setRun(run);
        } catch (e: any) {
          setError(e?.message ?? String(e));
        }
      },
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
  }, [client, id, initial]);

  return { run, journal, loading, error };
}

export default useRun;
