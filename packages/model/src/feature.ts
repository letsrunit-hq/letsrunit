import { randomUUID, type UUID } from 'node:crypto';
import { z } from 'zod';
import { connect } from './supabase';
import { type Data, type Feature, FeatureSchema, type ReadOptions, SuggestionSchema, type WriteOptions } from './types';
import { authorize } from './utils/auth';
import { fromData, toData } from './utils/convert';
import { DBError } from './utils/db-error';
import { maybeSignal } from './utils/signal';

const StoreSuggestionsSchema = SuggestionSchema.omit({ projectId: true });

export async function storeSuggestions(
  projectId: UUID,
  features: Array<z.infer<typeof StoreSuggestionsSchema>>,
  opts: WriteOptions = {},
): Promise<void> {
  const supabase = opts.supabase || connect();

  await authorize('projects', projectId, { supabase, by: opts.by });

  const { status, error } = await supabase.from('features').insert(
    features.map((f) => {
      const converted = toData(StoreSuggestionsSchema)(f as any);
      const { done, comments, ...rest } = converted as any;
      const cm = [comments, done && `Definition of done: ${done}`].filter(Boolean).join('\n');

      return {
        project_id: projectId,
        ...rest,
        comments: cm,
        created_by: opts.by?.id,
      };
    }),
  );

  if (error) throw new DBError(status, error);
}

export async function getFeature(id: UUID, opts: ReadOptions = {}): Promise<Feature> {
  const supabase = opts.supabase || connect();

  const { data, status, error } = await supabase
    .from('features')
    .select<'features', Data<Feature>>()
    .eq('id', id)
    .abortSignal(maybeSignal(opts))
    .single();

  if (error) throw new DBError(status, error);

  return fromData(FeatureSchema)(data);
}

export async function getFeatureName(id: UUID, opts: ReadOptions = {}): Promise<string> {
  const supabase = opts.supabase || connect();

  const { data, status, error } = await supabase
    .from('features')
    .select('name')
    .eq('id', id)
    .abortSignal(maybeSignal(opts))
    .single<{ name: string }>();

  if (error) throw new DBError(status, error);

  return data.name;
}

export async function getFeatureTarget(id: UUID, opts: ReadOptions = {}): Promise<string> {
  const supabase = opts.supabase || connect();

  const { data, status, error } = await supabase
    .from('features')
    .select('path, project:projects!inner(url)')
    .eq('id', id)
    .abortSignal(maybeSignal(opts))
    .single<{ path: string; project: { url: string } }>();

  if (error) throw new DBError(status, error);

  return new URL(data.path, data.project.url).toString();
}

export async function listFeatures(projectId: UUID, opts: ReadOptions = {}): Promise<Feature[]> {
  const supabase = opts.supabase || connect();

  const { data, status, error } = await supabase
    .from('features')
    .select('*, last_run:runs(*)')
    .eq('project_id', projectId)
    .order('created_at', { referencedTable: 'last_run', ascending: false })
    .limit(1, { referencedTable: 'last_run' })
    .abortSignal(maybeSignal(opts));

  if (error) throw new DBError(status, error);

  return data.map(fromData(FeatureSchema));
}

const CreateFeatureSchema = FeatureSchema.pick({
  projectId: true,
  name: true,
  description: true,
  comments: true,
  body: true,
  enabled: true,
})
  .partial()
  .required({ projectId: true });

export async function createFeature(
  feature: z.infer<typeof CreateFeatureSchema>,
  opts: WriteOptions = {},
): Promise<UUID> {
  const supabase = opts.supabase || connect();
  const id = randomUUID();

  await authorize('projects', feature.projectId, { supabase, by: opts.by });

  const { status, error } = await supabase
    .from('features')
    .insert({
      id,
      name: '',
      ...toData(CreateFeatureSchema)(feature),
      created_by: opts.by?.id,
    })
    .eq('id', id);

  if (error) throw new DBError(status, error);

  return id;
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
  opts: WriteOptions = {},
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
