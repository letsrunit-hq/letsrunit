import { explore } from '@letsrunit/executor';
import { type Run, storeSuggestions, updateProject, updateRunStatus } from '@letsrunit/model';
import type { HandleOptions } from '../types/handle';

export async function startExploreRun(run: Run, { supabase, journal }: HandleOptions) {
  try {
    const result = await explore(
      run.target,
      { journal },
      (info, actions) => Promise.all([
        updateProject(run.projectId, info, { supabase }),
        storeSuggestions(run.projectId, run.id, actions, { supabase }),
      ]),
    );

    await updateRunStatus(run.id, result, { supabase });
  } catch (error) {
    console.warn('Explore run failed', error);
    await updateRunStatus(run.id, { status: 'error', error: String(error) }, { supabase });
    return;
  }
}
