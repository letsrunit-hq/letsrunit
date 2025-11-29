import type { SupabaseClient, User } from '@supabase/supabase-js';
import { randomUUID, type UUID } from 'node:crypto';
import { z } from 'zod';
import { connect } from './supabase';
import { type Data, type Run, RunSchema, RunStatus } from './types';
import { authorize, getProjectId } from './utils/auth';
import { toData } from './utils/convert';
import { DBError } from './utils/db-error';

const CreateRunSchema = RunSchema
  .pick({
    type: true,
    projectId: true,
    featureId: true,
    status: true,
    target: true,
  })
  .partial()
  .required({ type: true, target: true });

export async function createRun(
  run: z.infer<typeof CreateRunSchema>,
  opts: { supabase?: SupabaseClient; by?: Pick<User, 'id'> } = {},
): Promise<UUID> {
  const supabase = opts.supabase ?? connect();
  const runId = randomUUID();

  const projectId = run.featureId ? await getProjectId('features', run.featureId, { supabase }) : run.projectId;

  if (!projectId || (run.projectId && run.projectId !== projectId)) throw new DBError(403);
  await authorize('projects', projectId, { supabase, by: opts.by });

  // Create a new record for the run
  const { status, error } = await supabase.from('runs').insert({
    id: runId,
    status: 'queued',
    ...toData(CreateRunSchema)(run),
    project_id: projectId,
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
