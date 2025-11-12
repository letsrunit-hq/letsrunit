'use server';

import { connect } from '@/lib/supabase';
import { explore, type Result, type Action } from '@letsrunit/executor';
import { Journal, SupabaseSink } from '@letsrunit/journal';
import { randomUUID, type UUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createProject, updateProject } from '@/actions/project';

interface StartExploreOpts {
  projectId?: UUID;
  supabase?: SupabaseClient;
  journal?: Journal;
}

export async function startExploreRun(target: string, opts: StartExploreOpts = {}) {
  const runId = randomUUID();
  const supabase = opts.supabase ?? connect();

  const journal = opts.journal ?? new Journal(
    new SupabaseSink({ client: supabase, runId, storageBucket: 'screenshots' }),
  );

  const isNewProject = !opts.projectId;
  const projectId = opts.projectId ?? await createProject({ url: target, title: target }, { supabase });

  // Create a new record for the run
  await supabase.from('runs').insert({
    id: runId,
    projectId,
    type: 'explore',
    target,
    status: 'running',
    created_at: new Date().toISOString(),
  });

  // Don't wait on explore to finish
  explore(
    target,
    { journal },
    (info, actions) => Promise.all([
      isNewProject ? updateProject(projectId, info, { supabase }) : Promise.resolve(),
      storeSuggestions(projectId, runId, actions, { supabase }),
    ]),
  )
    .then((result) => storeRunResult(runId, result, { supabase }))
    .catch((e) => {
      console.error('Explore run failed', e);
      return storeRunResult(runId, { status: 'error' }, { supabase });
    });

  return runId;
}

async function storeSuggestions(
  projectId: string,
  runId: string,
  actions: Action[],
  { supabase }: { supabase: SupabaseClient},
){
  try {
    await supabase
      .from('suggestions')
      .insert(actions.map((a) => ({
        projectId,
        runId,
        name: a.name,
        description: a.description,
        done: a.done,
      })))
  } catch (e) {
    console.error('Failed to update run record', e);
  }
}

async function storeRunResult(runId: string, result: Result, { supabase }: { supabase: SupabaseClient}) {
  try {
    await supabase
      .from('runs')
      .update({ status: result.status, finished_at: new Date().toISOString() })
      .eq('id', runId);
  } catch (err) {
    console.error(`Failed to mark run as ${result.status}`, err);
  }
}
