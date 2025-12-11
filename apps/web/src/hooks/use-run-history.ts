'use client';

import { useStateWithRef } from '@/hooks/use-state-with-ref';
import { connect as connectBrowserSupabase } from '@/libs/supabase/browser';
import { fromData, getFeatureName, getRunHistory, type Run, RunSchema, type RunType, toFilter } from '@letsrunit/model';
import { clean } from '@letsrunit/utils';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UUID } from 'node:crypto';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface UseRunHistoryOptions {
  client?: SupabaseClient;
  limit?: number;
}

export type UseRunHistory = {
  runs: Run[];
  loading: boolean;
  error?: Error;
};

function sortRuns(list: Run[], limit: number) {
  return list.sort((a, b) => {
    const at = (a.startedAt ?? a.createdAt).getTime();
    const bt = (b.startedAt ?? b.createdAt).getTime();
    return bt - at;
  }).slice(0, limit);
}

export function useRunHistory(
  filter: {
    projectId: UUID;
    type?: RunType;
    featureId?: UUID;
  },
  initial?: Run[],
  opts: UseRunHistoryOptions = {},
): UseRunHistory {
  const limit = opts.limit ?? 200;
  const [runs, setRuns, runsRef] = useStateWithRef<Run[]>(sortRuns(initial ?? [], limit));
  const [loading, setLoading] = useState<boolean>(!initial);
  const [error, setError] = useState<Error | undefined>(undefined);

  const supabase = useMemo(() => opts.client ?? connectBrowserSupabase(), [opts.client]);
  const { projectId, type: runType, featureId } = filter;
  const shouldLoad = !initial;

  const onRunEvent = useCallback(async (payload: any) => {
    const eventType: string | undefined = payload?.eventType;
    if (eventType === 'DELETE') {
      setRuns((prev) => sortRuns(
        prev.filter((r) => r.id !== payload?.old?.id),
        limit,
      ));
      return;
    }

    if (!payload?.new) return;
    try {
      const run = fromData(RunSchema)(payload.new) as Run;

      if (!featureId && run.featureId) {
        // Name is not in payload; copy it if replacing, otherwise fetch it
        run.name = runsRef.current.find((r) => r.id === run.id)?.name
          ?? (await getFeatureName(run.featureId, { supabase }));
      }

      setRuns((prev) => sortRuns(
        [...prev.filter((r) => r.id !== run.id), run],
        limit,
      ));
    } catch (e: any) {
      setError(e instanceof Error ? e : new Error(String(e)));
    }
  }, [runsRef, setRuns, limit, featureId, supabase]);

  useEffect(() => {
    let cancelled = false;
    const filter =  clean({projectId, featureId, type: runType});

    async function load() {
      try {
        setLoading(true);
        const runs = await getRunHistory(filter, { supabase, limit });
        if (!cancelled) setRuns(sortRuns(runs, limit));
      } catch (e: any) {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (shouldLoad) {
      void load();
    }

    const channel = supabase
      .channel(`runs:project:${projectId}${featureId ? `:feature:${featureId}` : ''}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'runs', filter: toFilter(RunSchema, filter) },
        onRunEvent,
      )
      .subscribe();

    return () => {
      cancelled = true;
      try {
        void supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    };
  }, [projectId, featureId, runType, shouldLoad, limit, onRunEvent, setRuns, supabase]);

  return useMemo(() => ({ runs, loading, error }), [runs, loading, error]);
}

export default useRunHistory;
