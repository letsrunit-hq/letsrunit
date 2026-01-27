'use client';

import { useAbortController } from '@/hooks/use-abort-controller';
import useSupabase from '@/hooks/use-supabase';
import { type Feature, FeatureSchema, fromData, listFeatures, type Run, RunSchema } from '@letsrunit/model';
import type { UUID } from '@letsrunit/utils';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';

export interface UseFeatureListOptions {
  client?: SupabaseClient;
}

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

export function useFeatureList(projectId: UUID, initial?: Feature[], opts: UseFeatureListOptions = {}) {
  const [features, setFeatures] = useState<Feature[]>(sortByTime(initial ?? []));
  const [loading, setLoading] = useState<boolean>(!initial);
  const [error, setError] = useState<string | null>(null);
  const client = useSupabase(opts, setError);
  const { signal } = useAbortController();

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
    if (!client) return;

    async function load() {
      if (!client) return;
      try {
        setLoading(true);
        const list = await listFeatures(projectId, { supabase: client, signal });
        setFeatures(sortByTime(list));
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    }

    if (!initial) {
      void load();
    }

    const channel = client.channel(`realtime:feature_list:${projectId}`);

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'runs', filter: `project_id=eq.${projectId}` },
        onRunEvent,
      )
      .subscribe();

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'features', filter: `project_id=eq.${projectId}` },
        onFeatureEvent,
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel).catch(() => {});
    };
  }, [initial, projectId, client, onRunEvent, onFeatureEvent, setFeatures, signal]);

  return { features, loading, error };
}

export default useFeatureList;
