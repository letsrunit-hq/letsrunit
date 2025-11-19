import { connect, type Run, updateRunStatus } from '@letsrunit/model';
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

  try {
    await updateRunStatus(run.id, 'running', { supabase });
    const result = await startRun(run, { supabase, journal });
    await updateRunStatus(run.id, result, { supabase });
  } catch (error) {
    await updateRunStatus(run.id, { status: 'error', error: (error as any).message }, { supabase });
  }
}

async function startRun(run: Run, opts: HandleOptions) {
  switch (run.type) {
    case 'explore':
      return await startExploreRun(run, opts);
    case 'test':
      throw new Error('Test run not implemented yet');
    default:
      throw new Error(`Unknown handler type "${run.type}"`);
  }
}
