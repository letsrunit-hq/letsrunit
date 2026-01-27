import { randomUUID, type UUID } from '@letsrunit/utils';
import { File } from 'node:buffer';
import { z } from 'zod';
import { connect } from './supabase';
import {
  type Data,
  type Project,
  ProjectBaseSchema,
  ProjectSchema,
  type ReadOptions,
  type WriteOptions,
} from './types';
import { authorize, authorizeForAccount } from './utils/auth';
import { fromData, toData } from './utils/convert';
import { DBError } from './utils/db-error';
import { saveScreenshot } from './utils/screenshot';
import { maybeSignal } from './utils/signal';

export async function getProject(id: UUID, opts: ReadOptions = {}): Promise<Project> {
  const supabase = opts.supabase ?? connect();

  const { data, status, error } = await supabase
    .from('projects')
    .select(
      `
      *,
      tests:features!left(count),
      suggestions:features!left(count),
      runs:runs(status)
    `,
    )
    .is('tests.body', 'not.null')
    .is('suggestions.body', 'null')
    .eq('id', id)
    .abortSignal(maybeSignal(opts))
    .single();

  if (error) throw new DBError(status, error);
  return fromData(ProjectSchema)(data as any);
}

export async function listProjects(opts: ReadOptions = {}): Promise<Project[]> {
  const supabase = opts.supabase ?? connect();

  const { data, status, error } = await supabase
    .from('projects')
    .select(
      `
      *,
      tests:features!left(count),
      suggestions:features!left(count),
      runs:runs(status)
    `,
    )
    .is('tests.body', 'not.null')
    .is('suggestions.body', 'null')
    .abortSignal(maybeSignal(opts));

  if (error) throw new DBError(status, error);

  return (data as any[]).map(fromData(ProjectSchema));
}

const CreateProjectSchema = ProjectBaseSchema.omit({ id: true }).partial().required({ url: true });

export async function createProject(
  project: z.infer<typeof CreateProjectSchema>,
  opts: WriteOptions = {},
): Promise<UUID> {
  const supabase = opts.supabase ?? connect();
  const id = randomUUID();
  const now = new Date();

  if (opts.by?.id) {
    project.accountId ??= opts.by.id as UUID;
    await authorizeForAccount(project.accountId, { supabase, by: opts.by });
  }

  const { status, error } = await supabase.from('projects').insert({
    ...toData(CreateProjectSchema)({
      name: project.url.replace(/https?:\/\/(www\.)?/, ''),
      ...project,
      createdAt: now,
      updatedAt: now,
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

const UpdateProjectSchema = ProjectBaseSchema.omit({ id: true }).partial();

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
