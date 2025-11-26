import type { SupabaseClient, User } from '@supabase/supabase-js';
import { randomUUID, type UUID } from 'node:crypto';
import { connect } from './supabase';
import { type Project, ProjectSchema } from './types';
import { fromData, toData } from './utils/convert';
import { z } from 'zod';
import { DBError } from './utils/db-error';
import { saveScreenshot } from './utils/screenshot';
import { File } from 'node:buffer';
import { authorize, authorizeForAccount } from './utils/auth';

export async function getProject(id: string, opts: { supabase?: SupabaseClient } = {}): Promise<Project | null> {
  const supabase = opts.supabase ?? connect();

  const { data, status, error } = await supabase.from('projects').select().eq('id', id).maybeSingle();

  if (!data || (status > 400 && status < 500)) {
    return null;
  }

  if (error) throw new DBError(status, error);

  return fromData(ProjectSchema)(data);
}

const CreateProjectSchema = ProjectSchema.omit({ id: true }).partial().required({ url: true });

export async function createProject(
  project: z.infer<typeof CreateProjectSchema>,
  opts: { supabase?: SupabaseClient; by?: Pick<User, 'id'> } = {},
): Promise<UUID> {
  const supabase = opts.supabase ?? connect();
  const id = randomUUID();

  if (opts.by?.id) {
    project.accountId ??= opts.by.id as UUID;
    await authorizeForAccount(project.accountId, { supabase, by: opts.by })
  }

  const { status, error } = await supabase.from('projects').insert({
    ...toData(CreateProjectSchema)({
      title: project.url.replace(/https?:\/\/(www\.)?/, ''),
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

const UpdateProjectSchema = ProjectSchema.omit({ id: true }).partial();

export async function updateProject(
  id: UUID,
  values: Omit<z.infer<typeof UpdateProjectSchema>, 'screenshot'> & { screenshot?: File | string },
  opts: { supabase?: SupabaseClient; by?: Pick<User, 'id'> } = {},
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
