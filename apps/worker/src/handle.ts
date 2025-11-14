import { connect, type Run } from '@letsrunit/model';
import { startExploreRun } from './handlers/explore';
import { Journal, SupabaseSink } from '@letsrunit/journal';
import type { HandleOptions } from './types/handle';

export async function handle(run: Run, { supabase, journal }: Partial<HandleOptions> = {}): Promise<void> {
  supabase ??= connect();
  journal ??= new Journal(new SupabaseSink({
    supabase,
    runId: run.id,
    tableName: 'journal_entries',
    bucket: 'artifacts',
  }));

  switch (run.type) {
    case 'explore':
      await startExploreRun(run, { supabase, journal });
      return;
    case 'test':
      throw new Error('Test run not implemented yet');
    default:
      throw new Error(`Unknown handler type "${run.type}"`);
  }
}
