import { useAbortController } from '@/hooks/use-abort-controller';
import useSupabase from '@/hooks/use-supabase';
import { type Data, fromData, getProject, type Project, ProjectSchema } from '@letsrunit/model';
import type { UUID } from '@letsrunit/utils';
import { isEntity } from '@letsrunit/utils';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

export interface UseProjectOptions {
  client?: SupabaseClient;
}

export function useProject(input: string | Project | undefined, opts: UseProjectOptions = {}) {
  const id = typeof input === 'string' ? input : input?.id;
  const initial = typeof input === 'object' ? input : undefined;

  const [project, setProject] = useState<Project | undefined>(initial);
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
        const project = await getProject(id as UUID, { supabase: client!, signal });
        setProject(project);
      } catch (e: any) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    }

    if (initial) {
      setProject(initial);
      setLoading(false);
    } else {
      void load();
    }

    const channel = client
      .channel(`realtime:project:${id}`)
      .on<Data<Project>>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects', filter: `id=eq.${id}` },
        (payload) => {
          if (!isEntity(payload.new)) return;
          try {
            setProject(fromData(ProjectSchema)(payload.new as Data<Project>));
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

  return { project, loading, error };
}

export default useProject;
