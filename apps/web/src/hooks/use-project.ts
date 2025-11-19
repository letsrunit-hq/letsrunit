import { useEffect, useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { connect as supabase } from '@/libs/supabase/browser';
import { type Data, fromData, type Project, ProjectSchema } from '@letsrunit/model';

export interface UseProjectOptions {
  client?: SupabaseClient;
}

export function useProject(id: string | undefined, opts: UseProjectOptions = {}) {
  const injectedClient = opts.client;
  const [project, setProject] = useState<Project | null>(null);
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

    async function fetchProject() {
      const { data, error: e } = await client!.from('projects').select('*').eq('id', id).single();
      if (e) setError(e.message);
      else setProject(data as unknown as Project);
    }

    fetchProject()
      .catch((e) => setError(e?.message ?? String(e)))
      .finally(() => isActive && setLoading(false));

    const channel = client.channel(`realtime:project:${id}`);

    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `id=eq.${id}` }, (payload) => {
      try {
        const project = fromData(ProjectSchema)(payload as unknown as Data<Project>);
        setProject(project);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      }
    });

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

  return { project, loading, error };
}

export default useProject;
