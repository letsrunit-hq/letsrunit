'use client';

import React from 'react';
import { useRun } from '@/hooks/use-run';
import { RunResult } from '@/components/run-result';
import { AnimatedBackground } from '@/components/waiting-background';
import { QueueStatus } from '@/components/queue-status';
import styles from './screen.module.css';
import useProject from '@/hooks/use-project';
import type { UUID } from 'node:crypto';
import type { RunStatus } from '@letsrunit/model';

interface ScreenOptions {
  projectId: UUID;
  runId: UUID;
  status: RunStatus;
}

export default function Screen({ projectId, runId, status }: ScreenOptions) {
  const { run, journal, loading: runLoading, error: runError } = useRun(runId);
  const { project, loading: projectLoading, error: projectError } = useProject(projectId);

  const loading = runLoading || projectLoading;
  const error = runError || projectError;

  if (error) throw new Error(error);

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
      <RunResult project={project!} run={run!} journal={journal} />
    </main>
  );
}
