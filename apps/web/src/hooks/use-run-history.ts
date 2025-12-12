'use client';

import { useAbortController } from '@/hooks/use-abort-controller';
import { useStateWithRef } from '@/hooks/use-state-with-ref';
import useSupabase from '@/hooks/use-supabase';
import { fromData, getFeatureName, listRuns, type Run, RunSchema, type RunType, toFilter } from '@letsrunit/model';
import { clean } from '@letsrunit/utils';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UUID } from 'node:crypto';
import { useCallback, useEffect, useState } from 'react';

export interface UseRunHistoryOptions {
  client?: SupabaseClient;
  limit?: number;
}

function sortRuns(list: Run[], limit: number) {
  return list
    .sort((a, b) => {
      const at = (a.startedAt ?? a.createdAt).getTime();
      const bt = (b.startedAt ?? b.createdAt).getTime();
      return bt - at;
    })
    .slice(0, limit);
}

export function useRunHistory(
  filter: {
    projectId: UUID;
    type?: RunType;
    featureId?: UUID;
  },
  initial?: Run[],
  opts: UseRunHistoryOptions = {},
) {
  const limit = opts.limit ?? 200;
  const [runs, setRuns, runsRef] = useStateWithRef<Run[]>(sortRuns(initial ?? [], limit));
  const [loading, setLoading] = useState<boolean>(!initial);
  const [error, setError] = useState<string | null>(null);
  const client = useSupabase(opts, setError);
  const { signal } = useAbortController();

  const { projectId, type: runType, featureId } = filter;
  const shouldLoad = !initial;

  const onRunEvent = useCallback(
    async (payload: any) => {
      if (!client || signal.aborted) return;

      const eventType: string | undefined = payload?.eventType;
      if (eventType === 'DELETE') {
        setRuns((prev) =>
          sortRuns(
            prev.filter((r) => r.id !== payload?.old?.id),
            limit,
          ),
        );
        return;
      }

      if (!payload?.new) return;
      try {
        const run = fromData(RunSchema)(payload.new) as Run;

        if (!featureId && run.featureId) {
          // Name is not in payload; copy it if replacing, otherwise fetch it
          run.name = runsRef.current.find((r) => r.id === run.id)?.name
            ?? (await getFeatureName(run.featureId, { supabase: client, signal }));
        }

        setRuns((prev) => sortRuns([...prev.filter((r) => r.id !== run.id), run], limit));
      } catch (e: any) {
        setError(e?.message || String(e));
      }
    },
    [runsRef, setRuns, limit, featureId, client, signal],
  );

  useEffect(() => {
    if (!client) return;

    const filter = clean({ projectId, featureId, type: runType });

    async function load() {
      try {
        setLoading(true);
        const runs = await listRuns(filter, { supabase: client!, limit, signal });
        setRuns(sortRuns(runs, limit));
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    }

    if (shouldLoad) {
      void load();
    }

    const channel = client
      .channel(`runs:project:${projectId}${featureId ? `:feature:${featureId}` : ''}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'runs', filter: toFilter(RunSchema, filter) },
        onRunEvent,
      )
      .subscribe();

    return () => {
      try {
        void client.removeChannel(channel);
      } catch {
        // ignore
      }
    };
  }, [projectId, featureId, runType, shouldLoad, limit, onRunEvent, setRuns, client, signal]);

  return { runs, loading, error };
}

export default useRunHistory;
