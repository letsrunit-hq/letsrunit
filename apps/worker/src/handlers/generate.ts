import { generate, refineSuggestion } from '@letsrunit/executor';
import { makeFeature } from '@letsrunit/gherkin';
import { getFeature, type Run, updateFeature } from '@letsrunit/model';
import { clean, pick } from '@letsrunit/utils';
import type { HandleOptions } from '../types/handle';

export async function startGenerateRun(run: Run, { supabase, journal }: HandleOptions) {
  if (!run.featureId) throw new Error('No feature associated with Run');

  const feature = await getFeature(run.featureId, { supabase });
  const by = run.createdBy ? { id: run.createdBy } : undefined;

  await journal.info('Refining test instructions');
  const suggestion = await refineSuggestion(clean(pick(feature, ['name', 'description', 'comments'])));
  await updateFeature(feature.id, suggestion, { supabase, by });

  const result = await generate(run.target, suggestion, { journal });

  if (result.feature) {
    const body = makeFeature(result.feature);
    await updateFeature(feature.id, { body }, { supabase, by });
  }

  return { status: result.status };
}
