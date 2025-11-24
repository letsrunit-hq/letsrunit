import { generate } from '@letsrunit/executor';
import { getFeature, type Run, updateFeature } from '@letsrunit/model';
import type { HandleOptions } from '../types/handle';
import { clean } from '@letsrunit/utils';
import { makeFeature } from '@letsrunit/gherkin';

export async function startGenerateRun(run: Run, { supabase, journal }: HandleOptions) {
  if (!run.featureId) throw new Error('No feature associated with Run');

  const feature = await getFeature(run.featureId, { supabase });
  if (feature.body) throw new Error('Feature already generated');

  const result = await generate(run.target, clean(feature), { journal });

  if (result.feature) {
    const body = makeFeature(result.feature);
    const by = run.createdBy ? { id: run.createdBy } : undefined;

    await updateFeature(feature.id, { body }, { supabase, by });
  }

  return { status: result.status };
}
