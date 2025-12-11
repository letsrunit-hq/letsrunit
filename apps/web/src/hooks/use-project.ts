import { connect as supabase } from '@/libs/supabase/browser';
import { type Data, fromData, type Project, ProjectSchema } from '@letsrunit/model';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useMemo, useState } from 'react';

export interface UseProjectOptions {
  client?: SupabaseClient;
}

export function useProject(input: string | Project | undefined, opts: UseProjectOptions = {}) {
  const id = typeof input === 'string' ? input : input?.id;
  const initial = typeof input === 'object' ? input : undefined;

  const injectedClient = opts.client;
  const [project, setProject] = useState<Project | undefined>(initial);
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

  // Keep state in sync when an object is provided directly
  useEffect(() => {
    setProject(initial);
  }, [initial]);

  useEffect(() => {
    if (!id || !client) return;

    let isActive = true;

    async function fetchProject() {
      const { data, error: e } = await client!.from('projects').select('*').eq('id', id).single();
      if (e) {
        setError(e.message);
        return;
      }
      setProject(fromData(ProjectSchema)(data as unknown as Data<Project>));
    }

    if (!initial) {
      setLoading(true);
      setError(null);

      fetchProject()
        .catch((e) => setError(e?.message ?? String(e)))
        .finally(() => isActive && setLoading(false));
    } else {
      setLoading(false);
    }

    const channel = client.channel(`realtime:project:${id}`);

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'projects', filter: `id=eq.${id}` },
      (payload) => {
        try {
          setProject(fromData(ProjectSchema)(payload.new as unknown as Data<Project>));
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

  return { project, loading, error };
}

export default useProject;
