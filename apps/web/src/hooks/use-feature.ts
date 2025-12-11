import { connect as supabase } from '@/libs/supabase/browser';
import { type Data, type Feature, FeatureSchema, fromData } from '@letsrunit/model';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useMemo, useState } from 'react';

export interface UseFeatureOptions {
  client?: SupabaseClient;
}

export function useFeature(input: string | Feature | undefined, opts: UseFeatureOptions = {}) {
  const id = typeof input === 'string' ? input : input?.id;
  const initial = typeof input === 'object' ? input : undefined;

  const injectedClient = opts.client;
  const [feature, setFeature] = useState<Feature | undefined>(initial);
  const [loading, setLoading] = useState<boolean>(!initial);
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

  // Keep state in sync when a full object is provided by the caller
  useEffect(() => {
    setFeature(initial);
  }, [initial]);

  useEffect(() => {
    if (!id || !client) return;

    let isActive = true;

    async function fetchFeature() {
      const { data, error: e } = await client!.from('features').select('*').eq('id', id).single();
      if (e) {
        setError(e.message);
        return;
      }
      setFeature(fromData(FeatureSchema)(data as unknown as Data<Feature>));
    }

    if (!initial) {
      setLoading(true);
      setError(null);
      fetchFeature()
        .catch((e) => setError(e?.message ?? String(e)))
        .finally(() => isActive && setLoading(false));
    }

    const channel = client.channel(`realtime:feature:${id}`);

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'features', filter: `id=eq.${id}` },
      (payload) => {
        try {
          setFeature(fromData(FeatureSchema)(payload.new as unknown as Data<Feature>));
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

  return { feature, loading, error };
}

export default useFeature;
