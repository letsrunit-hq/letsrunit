import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { UUID } from 'node:crypto';
import { z } from 'zod';
import { connect } from './supabase';
import { type Data, type Feature, FeatureSchema, SuggestionSchema } from './types';
import { authorize } from './utils/auth';
import { fromData, toData } from './utils/convert';
import { DBError } from './utils/db-error';

const StoreSuggestionsSchema = SuggestionSchema
  .pick({ name: true, path: true, description: true, done: true })
  .partial({ path: true, done: true });

export async function storeSuggestions(
  projectId: UUID,
  features: Array<z.infer<typeof StoreSuggestionsSchema>>,
  opts: { supabase?: SupabaseClient; by?: Pick<User, 'id'> },
): Promise<void> {
  const supabase = opts.supabase || connect();

  await authorize('projects', projectId, { supabase, by: opts.by });

  const { status, error } = await supabase.from('features').insert(
    features.map(toData(StoreSuggestionsSchema)).map(({ done, ...data }) => ({
      project_id: projectId,
      ...data,
      comments: done ? `Definition of done: ${done}` : null,
      created_by: opts.by?.id,
    })),
  );

  if (error) throw new DBError(status, error);
}

export async function getFeature(id: UUID, opts: { supabase?: SupabaseClient } = {}): Promise<Feature> {
  const supabase = opts.supabase || connect();

  const { data, status, error } = await supabase.from('features').select().eq('id', id).maybeSingle<Data<Feature>>();

  if (error) throw new DBError(status, error);
  if (!data) throw new DBError(404);

  return fromData(FeatureSchema)(data);
}

const UpdateFeatureSchema = FeatureSchema.pick({
  name: true,
  description: true,
  comments: true,
  body: true,
  enabled: true,
}).partial();

export async function updateFeature(
  id: UUID,
  feature: z.infer<typeof UpdateFeatureSchema>,
  opts: { supabase?: SupabaseClient; by?: Pick<User, 'id'> } = {},
): Promise<void> {
  const supabase = opts.supabase || connect();

  await authorize('features', id, { supabase, by: opts.by });

  const { status, error } = await supabase
    .from('features')
    .update({
      ...toData(UpdateFeatureSchema)(feature),
      updated_by: opts.by?.id,
    })
    .eq('id', id);

  if (error) throw new DBError(status, error);
}

export async function getFeatureTarget(id: UUID, opts: { supabase?: SupabaseClient } = {}): Promise<string> {
  const supabase = opts.supabase || connect();

  const { data, status, error } = await supabase
    .from('features')
    .select('path, project:projects!inner(url)')
    .eq('id', id)
    .maybeSingle<{ path: string; project: { url: string }; }>();

  if (error) throw new DBError(status, error);
  if (!data) throw new DBError(404);

  return new URL(data.path, data.project.url).toString();
}
