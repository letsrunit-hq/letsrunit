import type { SupabaseClient } from '@supabase/supabase-js';
import { SuggestionSchema } from './types';
import type { UUID } from 'node:crypto';
import { toData } from './utils/convert';
import { z } from 'zod';

const StoreSuggestionSchema = SuggestionSchema.pick({ name: true, description: true, done: true });

export async function storeSuggestions(
  projectId: UUID,
  runId: UUID,
  suggestions: Array<z.infer<typeof StoreSuggestionSchema>>,
  { supabase }: { supabase: SupabaseClient },
): Promise<void> {
  const suggestionToData = toData(StoreSuggestionSchema);

  const { error } = await supabase.from('suggestions').insert(
    suggestions.map((suggestion) => ({
      project_id: projectId,
      run_id: runId,
      ...suggestionToData(suggestion),
    })),
  );

  if (error) throw error;
}
