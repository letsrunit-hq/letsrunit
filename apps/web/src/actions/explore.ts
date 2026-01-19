'use server';

import { getUser } from '@/libs/auth';
import { queueRun } from '@/libs/run';
import { connect } from '@/libs/supabase/server';
import { createProject } from '@letsrunit/model';
import type { SupabaseClient } from '@supabase/supabase-js';
import { type UUID } from 'node:crypto';

interface StartExploreOpts {
  projectId?: UUID;
  supabase?: SupabaseClient;
}

export async function startExploreRun(target: string, opts: StartExploreOpts = {}): Promise<UUID> {
  const supabase = opts.supabase || (await connect()); // SSR Only, no writes
  const user = await getUser({ supabase });

  if (!target.match(/^https?:\/\//)) {
    target = `https://${target}`;
  }

  const projectId = opts.projectId ?? (await createProject({ url: target, accountId: user.id as UUID }, { by: user }));

  return await queueRun({ type: 'explore', projectId, target }, { by: user });
}
