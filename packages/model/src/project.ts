import { File } from 'node:buffer';
import { randomUUID, type UUID } from 'node:crypto';
import { z } from 'zod';
import { connect } from './supabase';
import { type Data, type Project, ProjectSchema, type ReadOptions, type WriteOptions } from './types';
import { authorize, authorizeForAccount } from './utils/auth';
import { fromData, toData } from './utils/convert';
import { DBError } from './utils/db-error';
import { saveScreenshot } from './utils/screenshot';
import { maybeSignal } from './utils/signal';

export async function getProject(id: UUID, opts: ReadOptions = {}): Promise<Project> {
  const supabase = opts.supabase ?? connect();

  const { data, status, error } = await supabase
    .from('projects')
    .select<
      'projects',
      Data<Project> & {
        features: { count: number }[];
        suggestions: { count: number }[];
        runs: { status: string }[];
      }
    >(
      `
      *,
      features:features(count),
      suggestions:suggestions(count),
      runs:runs(status)
    `,
    )
    .eq('id', id)
    .abortSignal(maybeSignal(opts))
    .single();

  if (error) throw new DBError(status, error);

  const testsCount = data.features?.[0]?.count ?? 0;
  const suggestionsCount = data.suggestions?.[0]?.count ?? 0;
  const runs = data.runs ?? [];
  const passedRuns = runs.filter((r) => r.status === 'passed').length;
  const passRate = runs.length > 0 ? Math.round((passedRuns / runs.length) * 100) : 0;

  return fromData(ProjectSchema)({
    ...data,
    tests_count: testsCount,
    suggestions_count: suggestionsCount,
    pass_rate: passRate,
  });
}

export async function listProjects(opts: ReadOptions = {}): Promise<Project[]> {
  const supabase = opts.supabase ?? connect();

  const { data, status, error } = await supabase
    .from('projects')
    .select<
      'projects',
      (Data<Project> & {
        features: { count: number }[];
        suggestions: { count: number }[];
        runs: { status: string }[];
      })[]
    >(
      `
      *,
      features:features(count),
      suggestions:suggestions(count),
      runs:runs(status)
    `,
    )
    .abortSignal(maybeSignal(opts));

  if (error) throw new DBError(status, error);

  return data.map((item) => {
    const testsCount = item.features?.[0]?.count ?? 0;
    const suggestionsCount = item.suggestions?.[0]?.count ?? 0;
    const runs = item.runs ?? [];
    const passedRuns = runs.filter((r) => r.status === 'passed').length;
    const passRate = runs.length > 0 ? Math.round((passedRuns / runs.length) * 100) : 0;

    return fromData(ProjectSchema)({
      ...item,
      tests_count: testsCount,
      suggestions_count: suggestionsCount,
      pass_rate: passRate,
    });
  });
}

const CreateProjectSchema = ProjectSchema.omit({ id: true }).partial().required({ url: true });

export async function createProject(
  project: z.infer<typeof CreateProjectSchema>,
  opts: WriteOptions = {},
): Promise<UUID> {
  const supabase = opts.supabase ?? connect();
  const id = randomUUID();

  if (opts.by?.id) {
    project.accountId ??= opts.by.id as UUID;
    await authorizeForAccount(project.accountId, { supabase, by: opts.by });
  }

  const { status, error } = await supabase.from('projects').insert({
    ...toData(CreateProjectSchema)({
      name: project.url.replace(/https?:\/\/(www\.)?/, ''),
      ...project,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    id,
    created_by: opts.by?.id,
  });

  if (error) throw new DBError(status, error);

  return id;
}

export async function findProjectByUrl(url: string, opts: ReadOptions = {}): Promise<Project | null> {
  const supabase = opts.supabase ?? connect();

  if (!url.match(/^https?:\/\//)) {
    url = `https://${url}`;
  }

  const { data, error } = await supabase
    .from('projects')
    .select<'projects', Data<Project>>()
    .eq('url', url)
    .abortSignal(maybeSignal(opts))
    .maybeSingle();

  if (error) throw new DBError(0, error);

  return data ? fromData(ProjectSchema)(data) : null;
}

const UpdateProjectSchema = ProjectSchema.omit({ id: true }).partial();

export async function updateProject(
  id: UUID,
  values: Omit<z.infer<typeof UpdateProjectSchema>, 'screenshot'> & { screenshot?: File | string },
  opts: WriteOptions = {},
) {
  const supabase = opts.supabase ?? connect();

  await authorize('projects', id, { supabase, by: opts.by });

  if (values.screenshot instanceof File) {
    const publicUrl = await saveScreenshot(id, values.screenshot, { supabase });
    values = { ...values, screenshot: publicUrl };
  }

  const { status, error } = await supabase
    .from('projects')
    .update({
      ...toData(UpdateProjectSchema)({
        ...(values as Partial<Project>),
        updatedAt: new Date(),
      }),
      updated_by: opts.by?.id,
    })
    .eq('id', id);

  if (error) throw new DBError(status, error);
}
