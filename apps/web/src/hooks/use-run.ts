import { useAbortController } from '@/hooks/use-abort-controller';
import useSupabase from '@/hooks/use-supabase';
import { type Data, fromData, getJournal, getRun, type Journal, type Run, RunSchema } from '@letsrunit/model';
import type { UUID } from '@letsrunit/utils';
import { isEntity } from '@letsrunit/utils';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

export interface UseRunOptions {
  client?: SupabaseClient;
}

export function useRun(input: string | Run | undefined, opts: UseRunOptions = {}) {
  const id = typeof input === 'string' ? input : input?.id;
  const initial = typeof input === 'object' ? input : undefined;

  const [run, setRun] = useState<Run | undefined>(initial);
  const [journal, setJournal] = useState<Journal | undefined>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const client = useSupabase(opts, setError);
  const { signal } = useAbortController();

  useEffect(() => {
    if (!id || !client) return;

    async function loadRun() {
      try {
        const run = await getRun(id as UUID, { supabase: client!, signal });
        setRun(run);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      }
    }

    async function loadJournal() {
      try {
        const journal = await getJournal(id as UUID, { supabase: client!, signal });
        setJournal(journal);
      } catch (e: any) {
        setError((prev) => prev ?? e?.message ?? String(e));
      }
    }

    async function load() {
      setLoading(true);
      setError(null);

      try {
        await Promise.all([
          initial ? setRun(initial) : loadRun(), //
          loadJournal(),
        ]);
      } finally {
        setLoading(false);
      }
    }

    void load();

    const channel = client
      .channel(`realtime:run:${id}`)
      .on<Data<Run>>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'runs', filter: `id=eq.${id}` },
        (payload) => {
          if (!isEntity(payload.new)) return;
          try {
            setRun(fromData(RunSchema)(payload.new as Data<Run>));
          } catch (e: any) {
            setError(e?.message ?? String(e));
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'journal_entries', filter: `run_id=eq.${id}` },
        () => void loadJournal(),
      )
      .subscribe();

    return () => {
      void client?.removeChannel(channel).catch(() => {});
    };
  }, [client, id, initial, signal]);

  return { run, journal, loading, error };
}

export default useRun;
