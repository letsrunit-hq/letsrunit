'use server';

import { Journal } from '@letsrunit/journal';
import { type UUID } from 'node:crypto';
import { createProject, createRun } from '@letsrunit/model';

interface StartExploreOpts {
  projectId?: UUID;
  journal?: Journal;
}

export async function startExploreRun(target: string, opts: StartExploreOpts = {}): Promise<UUID> {
  const projectId = opts.projectId ?? (await createProject({ url: target, title: target }));
  return await createRun({ type: 'explore', projectId, target });
}
