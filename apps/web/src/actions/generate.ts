'use server';

import { getUser } from '@/libs/auth';
import { queueRun } from '@/libs/run';
import { connect } from '@/libs/supabase/server';
import { createFeature, getFeatureTarget, type Suggestion } from '@letsrunit/model';
import type { UUID } from '@letsrunit/utils';
import type { SupabaseClient } from '@supabase/supabase-js';

interface StartGenerateOpts {
  supabase?: SupabaseClient;
}

export async function startGenerateRun(feature: UUID | Suggestion, opts: StartGenerateOpts = {}): Promise<UUID> {
  const user = await getUser({ supabase: opts.supabase || (await connect()) });

  const featureId = typeof feature === 'object' ? await createFeature(feature, { by: user }) : feature;
  const target = await getFeatureTarget(featureId);

  return await queueRun({ type: 'generate', featureId, target }, { by: user });
}
