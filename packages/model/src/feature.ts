import type { SupabaseClient, User } from '@supabase/supabase-js';
import { type Feature, FeatureSchema, SuggestionSchema } from './types';
import type { UUID } from 'node:crypto';
import { fromData, toData } from './utils/convert';
import { z } from 'zod';
import { connect } from './supabase';
import { DBError } from './db-error';

const StoreSuggestionsSchema = SuggestionSchema.pick({ name: true, description: true, done: true }).partial({
  done: true,
});

export async function storeSuggestions(
  projectId: UUID,
  features: Array<z.infer<typeof StoreSuggestionsSchema>>,
  opts: { supabase?: SupabaseClient; by?: User },
): Promise<void> {
  const supabase = opts.supabase || connect();

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

/**
 * List all features for a project, including the last run for each feature in a single query.
 */
export async function listFeatures(projectId: UUID, opts: { supabase?: SupabaseClient } = {}): Promise<Feature[]> {
  const supabase = opts.supabase || connect();

  const { data, status, error } = await supabase
    .from('features')
    .select(
      [
        'id',
        'project_id',
        'name',
        'description',
        'comments',
        'body',
        'created_at',
        'created_by',
        'updated_at',
        'updated_by',
        // alias the relation to last_run and fetch only the most recent item via referenced table options
        'last_run:runs(*)',
      ].join(', '),
    )
    .eq('project_id', projectId)
    .order('created_at', { referencedTable: 'last_run', ascending: false })
    .limit(1, { referencedTable: 'last_run' });

  if (error) throw new DBError(status, error);

  const toFeature = fromData(FeatureSchema);

  // Coerce last_run from array to single object to match FeatureSchema.lastRun
  const normalized = (data as any[]).map((row) => ({
    ...row,
    last_run: Array.isArray(row.last_run) ? (row.last_run[0] ?? null) : (row.last_run ?? null),
  }));

  return normalized.map(toFeature);
}
