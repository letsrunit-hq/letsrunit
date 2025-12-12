import { run as runTest } from '@letsrunit/executor';
import { getFeature, type Run } from '@letsrunit/model';
import type { HandleOptions } from '../types/handle';

export async function startTestRun(run: Run, { supabase, journal }: HandleOptions) {
  if (!run.featureId) throw new Error('No feature associated with Run');

  const feature = await getFeature(run.featureId, { supabase });
  if (!feature.body) throw new Error('Feature not generated');

  return await runTest(run.target, feature.body, { journal });
}
