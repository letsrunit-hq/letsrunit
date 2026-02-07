'use client';

import { AnimatedBackground } from '@/components/animated-background';
import { QueueStatus } from '@/components/queue-status';
import { RunHistory } from '@/components/run-history/run-history';
import { RunResult } from '@/components/run-result';
import { SubtleHeader } from '@/components/subtle-header';
import { useFeature } from '@/hooks/use-feature';
import { useProject } from '@/hooks/use-project';
import { useRun } from '@/hooks/use-run';
import type { Feature, Project, Run } from '@letsrunit/model';
import { BreadCrumb } from 'primereact/breadcrumb';
import React from 'react';
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

  const crumbs = [{ label: project?.name || '...', url: `/projects/${project!.id}` }, { label: `Run #${run!.id}` }];

  if (run!.status === 'queued') {
    return (
      <div className="p-3 center">
        <AnimatedBackground waiting />
        <QueueStatus startTime={run?.createdAt} />
      </div>
    );
  }

  return (
    <div className={`p-3 ${styles.container}`}>
      <BreadCrumb model={crumbs} className="mb-5 hidden lg:block" />

      <RunResult project={project!} feature={feature} run={run!} loading={loading} journal={journal}>
        <SubtleHeader className="mt-6 mb-3">Run History</SubtleHeader>
        <RunHistory
          projectId={run!.projectId}
          featureId={run!.featureId || undefined}
          type={run!.featureId ? undefined : run!.type}
          runs={initial.history}
          currentRunId={run!.id}
        />
      </RunResult>
    </div>
  );
}
