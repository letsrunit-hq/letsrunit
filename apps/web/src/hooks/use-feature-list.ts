'use client';

import { connect as connectBrowserSupabase } from '@/libs/supabase/browser';
import { type Feature, FeatureSchema, fromData, getFeatureList, type Run, RunSchema } from '@letsrunit/model';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UUID } from 'node:crypto';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface UseFeatureListOptions {
  client?: SupabaseClient;
}
export type UseFeatureList = {
  features: Feature[];
  loading: boolean;
  error?: Error;
};

function sortByTime(list: Feature[]): Feature[] {
  return list.sort((a, b) => {
    const at = (a.lastRun?.createdAt ?? a.createdAt).getTime();
    const bt = (b.lastRun?.createdAt ?? b.createdAt).getTime();
    return bt - at;
  });
}

function updateLastRun(list: Feature[], run: Run): Feature[] {
  return list.map((f) => {
    if (f.id !== run.featureId) return f;
    const prevTime = (f.lastRun?.startedAt ?? f.lastRun?.createdAt ?? new Date(0)).getTime();
    const nextTime = (run.startedAt ?? run.createdAt).getTime();
    if (nextTime >= prevTime) {
      return { ...f, lastRun: run } as Feature;
    }
    return f;
  });
}

export function useFeatureList(projectId: UUID, initial?: Feature[], opts: UseFeatureListOptions = {}): UseFeatureList {
  const [features, setFeatures] = useState<Feature[]>(sortByTime(initial ?? []));
  const [loading, setLoading] = useState<boolean>(!initial);
  const [error, setError] = useState<Error | undefined>(undefined);

  const supabase = useMemo(() => opts.client ?? connectBrowserSupabase(), [opts.client]);
  const shouldLoad = !initial;

  const onRunEvent = useCallback(
    (payload: any) => {
      if (!payload?.new) return; // Ignore delete events
      const run = fromData(RunSchema)(payload.new);
      if (!run.featureId) return;

      setFeatures((prev) => sortByTime(updateLastRun(prev, run)));
    },
    [setFeatures],
  );

  const onFeatureEvent = useCallback(
    (payload: any) => {
      setFeatures((prev) => {
        const eventType: string | undefined = payload?.eventType;
        if (eventType === 'DELETE') {
          const id = payload?.old?.id;
          const next = prev.filter((f) => f.id !== id);
          return sortByTime(next);
        }

        if (!payload?.new) return prev;
        const toFeature = fromData(FeatureSchema);
        const row = payload.new;

        const normalized = { ...row, last_run: null };
        const incoming = toFeature(normalized) as Feature;

        let next: Feature[];
        const idx = prev.findIndex((f) => f.id === incoming.id);

        if (idx >= 0) {
          const preservedLastRun = prev[idx].lastRun ?? null;
          next = prev.slice();
          next[idx] = { ...incoming, lastRun: preservedLastRun } as Feature;
        } else {
          next = [...prev, incoming];
        }

        return sortByTime(next);
      });
    },
    [setFeatures],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const list = await getFeatureList(projectId, { supabase });
        if (!cancelled) setFeatures(sortByTime(list));
      } catch (e: any) {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (shouldLoad) {
      void load();
    }

    const runsChannel = supabase
      .channel(`runs:project:${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'runs', filter: `project_id=eq.${projectId}` },
        onRunEvent,
      )
      .subscribe();

    const featuresChannel = supabase
      .channel(`features:project:${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'features', filter: `project_id=eq.${projectId}` },
        onFeatureEvent,
      )
      .subscribe();

    return () => {
      cancelled = true;
      try {
        void supabase.removeChannel(runsChannel);
      } catch {}
      try {
        void supabase.removeChannel(featuresChannel);
      } catch {}
    };
  }, [shouldLoad, projectId, supabase, onRunEvent, onFeatureEvent, setFeatures]);

  return useMemo(() => ({ features, loading, error }), [features, loading, error]);
}

export default useFeatureList;
