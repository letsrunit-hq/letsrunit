'use client';

import { connect as connectBrowserSupabase } from '@/libs/supabase/browser';
import { type Feature, FeatureSchema, fromData, RunSchema } from '@letsrunit/model';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UUID } from 'node:crypto';
import { useEffect, useMemo, useState } from 'react';

export interface UseFeatureListOptions {
  client?: SupabaseClient;
}
export type UseFeatureList = {
  features: Feature[];
  loading: boolean;
  error?: Error;
};

export function useFeatureList(projectId: UUID, opts: UseFeatureListOptions = {}): UseFeatureList {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const supabase = opts.client ?? connectBrowserSupabase();

    async function load() {
      try {
        setLoading(true);
        // Inline former @letsrunit/model.listFeatures logic here
        const { data, status, error } = await supabase
          .from('features')
          .select(
            [
              'id',
              'project_id',
              'name',
              'description',
              'comments',
              'body',
              'enabled',
              'created_at',
              'created_by',
              'updated_at',
              'updated_by',
              'last_run:runs(*)',
            ].join(', '),
          )
          .eq('project_id', projectId)
          .order('created_at', { referencedTable: 'last_run', ascending: false })
          .limit(1, { referencedTable: 'last_run' });

        if (error) throw new Error(`Failed to load features (${status}): ${error.message || String(error)}`);

        const toFeature = fromData(FeatureSchema);
        const normalized = (data as any[]).map((row) => ({
          ...row,
          last_run: Array.isArray(row.last_run) ? (row.last_run[0] ?? null) : (row.last_run ?? null),
        }));

        const features = (normalized.map(toFeature) as Feature[]).sort((a, b) => {
          const at = (a.lastRun?.createdAt ?? a.createdAt).getTime();
          const bt = (b.lastRun?.createdAt ?? b.createdAt).getTime();
          return bt - at;
        });
        if (!cancelled) setFeatures(features);
      } catch (e: any) {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    // Subscribe to new and modified runs and update lastRun for a feature
    const runsChannel = supabase
      .channel(`runs:project:${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'runs', filter: `project_id=eq.${projectId}` },
        (payload: any) => {
          if (!payload?.new) return; // Ignore delete events

          const run = fromData(RunSchema)(payload.new);
          if (!run.featureId) return;

          setFeatures((prev) =>
            prev
              .map((f) => {
                if (f.id !== run.featureId) return f;
                const prevTime = (f.lastRun?.startedAt ?? f.lastRun?.createdAt ?? new Date(0)).getTime();
                const nextTime = (run.startedAt ?? run.createdAt).getTime();
                if (nextTime >= prevTime) {
                  return { ...f, lastRun: run } as Feature;
                }
                return f;
              })
              .sort((a, b) => {
                const at = (a.lastRun?.createdAt ?? a.createdAt).getTime();
                const bt = (b.lastRun?.createdAt ?? b.createdAt).getTime();
                return bt - at;
              }),
          );
        },
      )
      .subscribe();

    function sortByTime(list: Feature[]) {
      return list.sort((a, b) => {
        const at = (a.lastRun?.createdAt ?? a.createdAt).getTime();
        const bt = (b.lastRun?.createdAt ?? b.createdAt).getTime();
        return bt - at;
      });
    }

    // Watch feature changes (insert/update/delete) and keep the list in sync locally.
    const featuresChannel = supabase
      .channel(`features:project:${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'features', filter: `project_id=eq.${projectId}` },
        (payload: any) => {
          console.log(payload);

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
      )
      .subscribe();

    return () => {
      cancelled = true;
      try {
        void supabase.removeChannel(runsChannel);
      } catch {
        // ignore
      }
      try {
        void supabase.removeChannel(featuresChannel);
      } catch {
        // ignore
      }
    };
  }, [opts.client, projectId]);

  return useMemo(() => ({ features, loading, error }), [features, loading, error]);
}

export default useFeatureList;
