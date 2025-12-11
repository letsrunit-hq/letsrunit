'use client';

import { AnimatedBackground } from '@/components/animated-background';
import { QueueStatus } from '@/components/queue-status';
import { RunResult } from '@/components/run-result';
import useFeature from '@/hooks/use-feature';
import useProject from '@/hooks/use-project';
import { useRun } from '@/hooks/use-run';
import useRunHistory from '@/hooks/use-run-history';
import type { Feature, Project, Run } from '@letsrunit/model';
import { BreadCrumb } from 'primereact/breadcrumb';
import React from 'react';
import RunHistory from '../../../components/run-history/run-history';
import styles from './screen.module.css';

interface ScreenOptions {
  run: Run;
  project: Project;
  feature?: Feature | null;
  history?: Run[];
}

export default function Screen(initial: ScreenOptions) {
  const { run, journal, loading, error: runError } = useRun(initial.run);
  if (runError) throw new Error(runError);

  const { project, error: projectError } = useProject(initial.project);
  if (projectError) throw new Error(projectError);

  const { feature, error: featureError } = useFeature(initial.feature ?? undefined);
  if (featureError) throw new Error(featureError);

  const { runs: history, loading: historyLoading } = useRunHistory({
    projectId: run!.projectId,
    featureId: run!.featureId || undefined,
    type: run!.featureId ? undefined : run!.type,
  }, initial.history);

  const crumbs = [{ label: project?.title || '...', url: `/projects/${project!.id}` }, { label: `Run #${run!.id}` }];

  if (run!.status === 'queued') {
    return (
      <main className="p-3 center">
        <AnimatedBackground waiting />
        <QueueStatus />
      </main>
    );
  }

  return (
    <>
      <main className={`p-3 ${styles.container}`}>
        <BreadCrumb model={crumbs} className="mb-5" />

        <RunResult project={project!} feature={feature} run={run!} loading={loading} journal={journal}>
          {!historyLoading && <RunHistory className="mt-6" runs={history} currentRunId={run!.id} />}
        </RunResult>
      </main>
    </>
  );
}
