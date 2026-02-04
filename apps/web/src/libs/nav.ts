import type { SupabaseClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { connect } from './supabase/server';

export interface NavOptions {
  supabase?: SupabaseClient;
}

export interface Selected {
  org?: string;
  project?: string;
  page?: string;
}

export async function getPathname(): Promise<string> {
  const headerList = await headers();
  return headerList.get('x-pathname') || '/';
}

async function fetchProjectOrg(id: string, { supabase }: { supabase: SupabaseClient }): Promise<string | undefined> {
  const { data: project } = await supabase.from('projects').select('account_id').eq('id', id).single();
  return project?.account_id;
}

async function fetchRunProject(id: string, { supabase }: { supabase: SupabaseClient }): Promise<string | undefined> {
  const { data: run } = await supabase.from('runs').select('project_id').eq('id', id).single();
  return run?.project_id;
}

export async function getSelected(pathname: string, options: NavOptions = {}): Promise<Selected> {
  const parts = pathname.split('/').filter(Boolean);
  const selected: Selected = {};

  if (parts[0] === 'projects' && parts[1]) {
    selected.project = parts[1];
    selected.page = parts[2] ? `project/${parts[2]}` : 'project';
  }

  if (parts[0] === 'runs' && parts[1]) {
    const supabase = options.supabase ?? (await connect());
    selected.project = await fetchRunProject(parts[1], { supabase });
  }

  if (parts[0] === 'org' && parts[1]) {
    selected.org = parts[1];
    selected.page = parts[2] ? `org/${parts[2]}` : undefined;
  }

  if (selected.project && !selected.org) {
    const supabase = options.supabase ?? (await connect());
    selected.org = await fetchProjectOrg(selected.project, { supabase });
  }

  return selected;
}
