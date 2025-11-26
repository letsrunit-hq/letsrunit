import type { SupabaseClient, User } from '@supabase/supabase-js';
import { randomUUID, type UUID } from 'node:crypto';
import { type Data, type Run, RunSchema, RunStatus } from './types';
import { connect } from './supabase';
import { z } from 'zod';
import { toData } from './utils/convert';
import { DBError } from './utils/db-error';
import { authorize } from './utils/auth';

const CreateRunSchema = RunSchema.pick({ projectId: true, type: true, status: true, target: true }).partial({
  status: true,
});

export async function createRun(
  run: z.infer<typeof CreateRunSchema>,
  opts: { supabase?: SupabaseClient; by?: Pick<User, 'id'> } = {},
): Promise<UUID> {
  const supabase = opts.supabase ?? connect();
  const runId = randomUUID();

  if (!run.projectId) throw new DBError(403);
  await authorize('projects', run.projectId, { supabase, by: opts.by });

  // Create a new record for the run
  const { status, error } = await supabase.from('runs').insert({
    id: runId,
    status: 'queued',
    ...toData(CreateRunSchema)(run),
    created_by: opts.by?.id,
  });

  if (error) throw new DBError(status, error);

  return runId;
}

export async function updateRunStatus(
  runId: UUID,
  result: RunStatus | { status: RunStatus; error?: string },
  opts: { supabase?: SupabaseClient; by?: Pick<User, 'id'> } = {},
): Promise<void> {
  const supabase = opts.supabase ?? connect();
  const { status, error } = typeof result === 'object' ? result : { status: result };

  const data: Partial<Data<Run>> = { status, error };
  if (status === 'running') data.started_at = new Date().toISOString();
  if (status === 'passed' || status === 'failed') data.finished_at = new Date().toISOString();

  await authorize('runs', runId, { supabase, by: opts.by });

  const { status: qs, error: qe } = await supabase.from('runs').update(data).eq('id', runId);
  if (qe) throw new DBError(qs, qe);
}
