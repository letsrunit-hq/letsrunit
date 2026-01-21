import type { Result } from '@letsrunit/executor';
import { Journal, SupabaseSink } from '@letsrunit/journal';
import { connect, type Run, updateRunStatus } from '@letsrunit/model';
import { startExploreRun } from './handlers/explore';
import { startGenerateRun } from './handlers/generate';
import { startTestRun } from './handlers/test';
import type { HandleOptions } from './types/handle';

const ARTIFACT_BUCKET = process.env.ARTIFACT_BUCKET || 'artifacts';

export async function handle(run: Run, { supabase, journal }: Partial<HandleOptions> = {}): Promise<void> {
  supabase ??= connect();
  journal ??= new Journal(
    new SupabaseSink({
      supabase,
      run,
      tableName: 'journal_entries',
      bucket: ARTIFACT_BUCKET,
    }),
  );

  try {
    const result = await execRun(run, { supabase, journal });
    await updateRunStatus(run.id, result, { supabase });
  } catch (error) {
    console.error(error);
    await updateRunStatus(run.id, { status: 'error', error: (error as any).message }, { supabase });
  }
}

async function execRun(run: Run, opts: HandleOptions): Promise<Result> {
  switch (run.type) {
    case 'explore':
      return await startExploreRun(run, opts);
    case 'generate':
      return await startGenerateRun(run, opts);
    case 'test':
      return await startTestRun(run, opts);
    default:
      throw new Error(`Unknown handler type "${run.type}"`);
  }
}
