import { connect, type Run, updateRunStatus } from '@letsrunit/model';
import { startExploreRun } from './handlers/explore';
import { Journal, SupabaseSink } from '@letsrunit/journal';
import type { HandleOptions } from './types/handle';

const ARTIFACT_BUCKET = process.env.ARTIFACT_BUCKET || 'artifacts';

export async function handle(run: Run, { supabase, journal }: Partial<HandleOptions> = {}): Promise<void> {
  supabase ??= connect();
  journal ??= new Journal(new SupabaseSink({
    supabase,
    run,
    tableName: 'journal_entries',
    bucket: ARTIFACT_BUCKET,
  }));

  try {
    await updateRunStatus(run.id, 'running', { supabase });
    const result = await startRun(run, { supabase, journal });
    await updateRunStatus(run.id, result, { supabase });
  } catch (error) {
    console.error(error);
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
