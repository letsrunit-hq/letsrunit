'use server';

import { type UUID } from 'node:crypto';
import { createProject, createRun } from '@letsrunit/model';
import type { SupabaseClient } from '@supabase/supabase-js';
import { connect } from '@/libs/supabase/server';

interface StartExploreOpts {
  projectId?: UUID;
  supabase?: SupabaseClient;
}

export async function startExploreRun(target: string, opts: StartExploreOpts = {}): Promise<UUID> {
  const client = opts.supabase || (await connect());

  if (!target.match(/^https?:\/\//)) {
    target = `https://${target}`;
  }

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) throw new Error('Not signed in');

  const projectId =
    opts.projectId ??
    (await createProject({ url: target, accountId: user.id as UUID }, { by: user }));

  return await createRun({ type: 'explore', projectId, target }, { by: user });
}
