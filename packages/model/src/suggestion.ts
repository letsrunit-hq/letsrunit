import type { SupabaseClient, User } from '@supabase/supabase-js';
import { SuggestionSchema } from './types';
import type { UUID } from 'node:crypto';
import { toData } from './utils/convert';
import { z } from 'zod';
import { connect } from './supabase';

const StoreSuggestionSchema = SuggestionSchema.pick({ name: true, description: true, done: true });

export async function storeSuggestions(
  projectId: UUID,
  runId: UUID,
  suggestions: Array<z.infer<typeof StoreSuggestionSchema>>,
  opts: { supabase?: SupabaseClient, by?: User },
): Promise<void> {
  const supabase = opts.supabase || connect();
  const suggestionToData = toData(StoreSuggestionSchema);

  const { error } = await supabase.from('suggestions').insert(
    suggestions.map((suggestion) => ({
      project_id: projectId,
      run_id: runId,
      ...suggestionToData(suggestion),
      created_by: opts.by?.id,
    })),
  );

  if (error) throw error;
}
