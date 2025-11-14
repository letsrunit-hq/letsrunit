import type { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID, type UUID } from 'node:crypto';
import { connect } from './supabase';
import { type Project, type ProjectData, ProjectSchema } from './types';
import { fromData, toData } from './utils/convert';
import { z } from 'zod';

const CreateProjectSchema = ProjectSchema.omit({ id: true }).partial().required({ url: true });

export async function createProject(
  project: z.infer<typeof CreateProjectSchema>,
  opts: { supabase?: SupabaseClient } = {},
): Promise<UUID> {
  const supabase = opts.supabase ?? connect();
  const id = randomUUID();

  const { error } = await supabase.from('projects').insert({
    ...toData(CreateProjectSchema)(project),
    id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;

  return id;
}

const UpdateProjectSchema = ProjectSchema.omit({ id: true }).partial();

export async function updateProject(
  id: UUID,
  values: z.infer<typeof UpdateProjectSchema>,
  opts: { supabase?: SupabaseClient } = {},
) {
  const supabase = opts.supabase ?? connect();

  const { error } = await supabase
    .from('projects')
    .update({
      ...toData(UpdateProjectSchema)(values),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

export async function getProject(projectId: UUID, opts: { supabase?: SupabaseClient } = {}): Promise<Project> {
  const supabase = opts.supabase ?? connect();

  const data = (await supabase.from('projects').select().eq('id', projectId)) as unknown as ProjectData;
  return fromData(ProjectSchema)(data);
}
