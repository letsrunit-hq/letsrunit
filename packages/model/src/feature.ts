import type { SupabaseClient, User } from '@supabase/supabase-js';
import { SuggestionSchema } from './types';
import type { UUID } from 'node:crypto';
import { toData } from './utils/convert';
import { z } from 'zod';
import { connect } from './supabase';
import { DBError } from './db-error';

const StoreSuggestionsSchema = SuggestionSchema
  .pick({ name: true, description: true, done: true })
  .partial({ done: true });

export async function storeSuggestions(
  projectId: UUID,
  features: Array<z.infer<typeof StoreSuggestionsSchema>>,
  opts: { supabase?: SupabaseClient; by?: User },
): Promise<void> {
  const supabase = opts.supabase || connect();

  const { status, error } = await supabase.from('features').insert(
    features
      .map(toData(StoreSuggestionsSchema))
      .map(({ done, ...data }) => ({
        project_id: projectId,
        ...data,
        comments: done ? `Definition of done: ${done}` : null,
        created_by: opts.by?.id,
      })),
  );

  if (error) throw new DBError(status, error);
}
