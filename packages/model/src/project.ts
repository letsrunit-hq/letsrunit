import type { SupabaseClient, User } from '@supabase/supabase-js';
import { randomUUID, type UUID } from 'node:crypto';
import { connect } from './supabase';
import { type Data, type Project, ProjectSchema } from './types';
import { fromData, toData } from './utils/convert';
import { z } from 'zod';
import { DbError } from './db-error';

const CreateProjectSchema = ProjectSchema.omit({ id: true }).partial().required({ accountId: true, url: true });

export async function getProject(id: string, opts: { supabase?: SupabaseClient } = {}): Promise<Project> {
  const supabase = opts.supabase ?? connect();

  const { data, status, error } = await supabase.from('projects').select().eq('id', id);
  if (error) throw new DbError(status, error);

  return fromData(ProjectSchema)(data as unknown as Data<Project>);
}

export async function createProject(
  project: z.infer<typeof CreateProjectSchema>,
  opts: { supabase?: SupabaseClient; by?: User } = {},
): Promise<UUID> {
  const supabase = opts.supabase ?? connect();
  const id = randomUUID();

  const { status, error } = await supabase.from('projects').insert({
    ...toData(CreateProjectSchema)(project),
    id,
    created_by: opts.by?.id,
  });

  if (error) throw new DbError(status, error);

  return id;
}

const UpdateProjectSchema = ProjectSchema.omit({ id: true }).partial();

export async function updateProject(
  id: UUID,
  values: z.infer<typeof UpdateProjectSchema>,
  opts: { supabase?: SupabaseClient; by?: User } = {},
) {
  const supabase = opts.supabase ?? connect();

  const { status, error } = await supabase
    .from('projects')
    .update({
      ...toData(UpdateProjectSchema)(values),
      updated_by: opts.by?.id,
    })
    .eq('id', id);

  if (error) throw new DbError(status, error);
}
