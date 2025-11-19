import { explore } from '@letsrunit/executor';
import { type Run, storeSuggestions, updateProject } from '@letsrunit/model';
import type { HandleOptions } from '../types/handle';

export async function startExploreRun(run: Run, { supabase, journal }: HandleOptions) {
  return await explore(run.target, { journal }, (info, actions) =>
    Promise.all([
      updateProject(run.projectId, info, { supabase }),
      storeSuggestions(run.projectId, run.id, actions, { supabase }),
    ]),
  );
}
