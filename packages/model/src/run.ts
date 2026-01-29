import { randomUUID, type UUID } from '@letsrunit/utils';
import { z } from 'zod';
import { connect } from './supabase';
import { type Data, type ReadOptions, type Run, RunSchema, RunStatus, type RunType, type WriteOptions } from './types';
import { authorize, getProjectId } from './utils/auth';
import { fromData, toData } from './utils/convert';
import { DBError } from './utils/db-error';
import { maybeSignal } from './utils/signal';

export async function getRun(id: string, opts: ReadOptions = {}): Promise<Run> {
  const supabase = opts.supabase ?? connect();

  const { data, status, error } = await supabase
    .from('runs')
    .select('*, name:features!left(name)')
    .eq('id', id)
    .abortSignal(maybeSignal(opts))
    .single<Data<Run>>();

  if (error) throw new DBError(status, error);

  return fromData(RunSchema)(data);
}

export async function listRuns(
  filter: { projectId: UUID; type?: RunType; featureId?: UUID },
  opts: ReadOptions & { limit?: number } = {},
) {
  const supabase = opts.supabase ?? connect();

  let query = supabase
    .from('runs')
    .select('*, name:features!left(name)')
    .eq('project_id', filter.projectId)
    .order('created_at', { ascending: false })
    .abortSignal(maybeSignal(opts));

  if (filter.type) query = query.eq('type', filter.type);
  if (filter.featureId) query = query.eq('feature_id', filter.featureId);
  if (opts.limit) query = query.limit(opts.limit);

  const { data, status, error } = await query;

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

export async function createRun(run: z.infer<typeof CreateRunSchema>, opts: WriteOptions = {}): Promise<UUID> {
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
  opts: WriteOptions = {},
): Promise<boolean> {
  const supabase = opts.supabase ?? connect();
  const { status, error } = typeof result === 'object' ? result : { status: result };

  const data: Partial<Data<Run>> = toData(RunSchema.partial())({ status, error });
  if (status === 'running') data.started_at = new Date().toISOString();
  if (status === 'passed' || status === 'failed' || status === 'error') data.finished_at = new Date().toISOString();

  await authorize('runs', runId, { supabase, by: opts.by });

  let query = supabase
    .from('runs')
    .update(data)
    .eq('id', runId)
    .in('status', ['queued', 'running'])
    .neq('status', status);

  if (status === 'queued') {
    query = query.neq('status', 'running');
  }

  const { status: qs, error: qe, data: updated } = await query.select('id').single();
  if (qe && qe.code !== 'PGRST116') throw new DBError(qs, qe);

  return !!updated;
}
