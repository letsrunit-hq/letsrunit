import type { SupabaseClient, User } from '@supabase/supabase-js';
import { randomUUID, type UUID } from 'node:crypto';
import { z } from 'zod';
import { connect } from './supabase';
import { type Data, type Run, RunSchema, RunStatus, type RunType } from './types';
import { authorize, getProjectId } from './utils/auth';
import { fromData, toData } from './utils/convert';
import { DBError } from './utils/db-error';

export async function getRun(id: string, opts: { supabase?: SupabaseClient } = {}): Promise<Run | null> {
  const supabase = opts.supabase ?? connect();

  const { data, status, error } = await supabase
    .from('runs')
    .select('*, name:features!left(name)')
    .eq('id', id)
    .maybeSingle<Data<Run>>();

  if (!data || (status > 400 && status < 500)) {
    return null;
  }
  if (error) throw new DBError(status, error);

  return fromData(RunSchema)(data);
}

export async function getRunHistory(
  filter: { projectId: UUID; type?: RunType; featureId?: UUID },
  opts: { supabase?: SupabaseClient; limit?: number } = {},
) {
  const supabase = opts.supabase ?? connect();

  let q = supabase
    .from('runs')
    .select('*, name:features!left(name)')
    .eq('project_id', filter.projectId)
    .order('created_at', { ascending: false });

  if (filter.type) q = q.eq('type', filter.type);
  if (filter.featureId) q = q.eq('feature_id', filter.featureId);
  if (opts.limit) q = q.limit(opts.limit);

  const { data, status, error } = await q;
  if (error) throw new DBError(status, error);

  const toRun = fromData(RunSchema);
  return data.map(toRun);
}

const CreateRunSchema = RunSchema.pick({
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
