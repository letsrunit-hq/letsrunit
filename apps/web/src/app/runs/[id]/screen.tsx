'use client';

import { AnimatedBackground } from '@/components/animated-background';
import { QueueStatus } from '@/components/queue-status';
import { RunResult } from '@/components/run-result';
import useFeature from '@/hooks/use-feature';
import useProject from '@/hooks/use-project';
import { useRun } from '@/hooks/use-run';
import type { RunStatus } from '@letsrunit/model';
import type { UUID } from 'node:crypto';
import React from 'react';
import styles from './screen.module.css';

interface ScreenOptions {
  projectId: UUID;
  featureId?: UUID;
  runId: UUID;
  status: RunStatus;
}

export default function Screen({ projectId, featureId, runId, status }: ScreenOptions) {
  const { run, journal, loading: runLoading, error: runError } = useRun(runId);
  if (runError) throw new Error(runError);

  const { project, loading: projectLoading, error: projectError } = useProject(projectId);
  if (projectError) throw new Error(projectError);

  const { feature, loading: featureLoading, error: featureError } = useFeature(featureId);
  if (featureError) throw new Error(featureError);

  const loading = runLoading || projectLoading || featureLoading;

  if ((run?.status ?? status) === 'queued') {
    return (
      <main className="p-3 center">
        <AnimatedBackground waiting />
        <QueueStatus />
      </main>
    );
  }

  if (loading) return <></>;

  return (
    <main className={`p-3 ${styles.container}`}>
      <RunResult project={project!} feature={feature} run={run!} journal={journal} />
    </main>
  );
}
