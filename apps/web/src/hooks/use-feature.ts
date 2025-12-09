import { useEffect, useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { connect as supabase } from '@/libs/supabase/browser';
import { type Data, fromData, type Feature, FeatureSchema } from '@letsrunit/model';

export interface UseFeatureOptions {
  client?: SupabaseClient;
}

export function useFeature(id: string | undefined, opts: UseFeatureOptions = {}) {
  const injectedClient = opts.client;
  const [feature, setFeature] = useState<Feature | null>(null);
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

  useEffect(() => {
    if (!id || !client) return;

    let isActive = true;
    setLoading(true);
    setError(null);

    async function fetchFeature() {
      const { data, error: e } = await client!.from('features').select('*').eq('id', id).single();
      if (e) {
        setError(e.message);
        return;
      }
      setFeature(fromData(FeatureSchema)(data as unknown as Data<Feature>));
    }

    fetchFeature()
      .catch((e) => setError(e?.message ?? String(e)))
      .finally(() => isActive && setLoading(false));

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
  }, [client, id]);

  return { feature, loading, error };
}

export default useFeature;
