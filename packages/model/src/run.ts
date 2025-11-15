import type { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID, type UUID } from 'node:crypto';
import { type Data, type Run, RunSchema, RunStatus } from './types';
import { connect } from './supabase';
import { z } from 'zod';
import { toData } from './utils/convert';

const CreateRunSchema = RunSchema.pick({ projectId: true, type: true, status: true, target: true }).partial({
  status: true,
});

export async function createRun(
  run: z.infer<typeof CreateRunSchema>,
  opts: { supabase?: SupabaseClient } = {},
): Promise<UUID> {
  const supabase = opts.supabase ?? connect();
  const runId = randomUUID();

  // Create a new record for the run
  const { error } = await supabase.from('runs').insert({
    id: runId,
    status: 'queued',
    ...toData(CreateRunSchema)(run),
    created_at: new Date().toISOString(),
  });

  if (error) throw error;

  return runId;
}

export async function updateRunStatus(
  runId: UUID,
  result: RunStatus | { status: RunStatus; error?: string },
  opts: { supabase?: SupabaseClient } = {},
): Promise<void> {
  const supabase = opts.supabase ?? connect();
  const { status, error } = typeof result === 'object' ? result : { status: result };

  const data: Partial<Data<Run>> = { status, error };
  if (status === 'running') data.started_at = new Date().toISOString();
  if (status === 'success' || status === 'failed') data.finished_at = new Date().toISOString();

  const { error: e } = await supabase.from('runs').update(data).eq('id', runId);

  if (e) throw e;
}
