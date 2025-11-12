import type { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID, type UUID } from 'node:crypto';
import { connect } from '@/lib/supabase';
import { AppInfo } from '@letsrunit/executor';

function toData(info: Partial<AppInfo>) {
  const map: Record<string, keyof AppInfo> = {
    title: 'title',
    description: 'description',
    image: 'image',
    logo: 'logo',
    author: 'author',
    publisher: 'publisher',
    lang: 'lang',
    favicon: 'favicon',
    url: 'url',
    purpose: 'purpose',
    login_available: 'loginAvailable',
  };

  return Object.fromEntries(
    Object.entries(map)
      .map(([key, prop]) => [key, info[prop]])
      .filter(([, value]) => value !== undefined),
  );
}


export async function createProject(info: Partial<AppInfo>, opts: { supabase?: SupabaseClient } = {}): Promise<UUID> {
  const projectId = randomUUID();
  const now = new Date().toISOString();
  const supabase = opts.supabase ?? connect();

  await supabase.from('projects').insert({
    id: projectId,
    ...toData(info),
    created_at: now,
    updated_at: now,
  });

  return projectId;
}

export async function updateProject(projectId: UUID, info: Partial<AppInfo>, opts: { supabase?: SupabaseClient } = {}) {
  const supabase = opts.supabase ?? connect();

  await supabase.from('projects').update({
    ...toData(info),
    updated_at: new Date().toISOString(),
  }).eq('id', projectId);
}
