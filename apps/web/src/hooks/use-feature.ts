import { useAbortController } from '@/hooks/use-abort-controller';
import useSupabase from '@/hooks/use-supabase';
import { type Data, type Feature, FeatureSchema, fromData, getFeature } from '@letsrunit/model';
import { isEntity } from '@letsrunit/utils';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UUID } from 'node:crypto';
import { useEffect, useState } from 'react';

export interface UseFeatureOptions {
  client?: SupabaseClient;
}

export function useFeature(input: string | Feature | undefined, opts: UseFeatureOptions = {}) {
  const id = typeof input === 'string' ? input : input?.id;
  const initial = typeof input === 'object' ? input : undefined;

  const [feature, setFeature] = useState<Feature | undefined>(initial);
  const [loading, setLoading] = useState<boolean>(!initial);
  const [error, setError] = useState<string | null>(null);
  const client = useSupabase(opts, setError);
  const { signal } = useAbortController();

  useEffect(() => {
    if (!id || !client) return;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const feature = await getFeature(id as UUID, { supabase: client!, signal });
        setFeature(feature);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    }

    if (initial) {
      setFeature(initial);
      setLoading(false);
    } else {
      void load();
    }

    const channel = client
      .channel(`realtime:feature:${id}`)
      .on<Data<Feature>>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'features', filter: `id=eq.${id}` },
        (payload) => {
          if (!isEntity(payload.new)) return; // Ignore delete
          try {
            setFeature(fromData(FeatureSchema)(payload.new as Data<Feature>));
          } catch (e: any) {
            setError(e?.message ?? String(e));
          }
        },
      )
      .subscribe();

    return () => {
      void client?.removeChannel(channel).catch(() => {});
    };
  }, [client, id, initial, signal]);

  return { feature, loading, error };
}

export default useFeature;
