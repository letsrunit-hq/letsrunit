'use server';

import { getUser } from '@/libs/auth';
import { connect } from '@/libs/supabase/server';
import { createRun, getFeatureTarget } from '@letsrunit/model';
import type { SupabaseClient } from '@supabase/supabase-js';
import { type UUID } from 'node:crypto';

interface StartGenerateOpts {
  supabase?: SupabaseClient;
}

export async function startGenerateRun(featureId: UUID, opts: StartGenerateOpts = {}): Promise<UUID> {
  const supabase = opts.supabase || (await connect()); // SSR Only, no writes
  const user = await getUser({ supabase });

  const target = await getFeatureTarget(featureId);

  return await createRun({ type: 'generate', featureId, target }, { by: user });
}
