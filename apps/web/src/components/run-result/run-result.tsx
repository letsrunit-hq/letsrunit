'use client';

import { RunTimeline, RunTimelineSkeleton } from '@/components/run-timeline';
import { Screenshot } from '@/components/screenshot';
import type { Artifact, Journal, Project, Run, RunStatus } from '@letsrunit/model';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import React, { useEffect } from 'react';
import styles from './run-result.module.css';

export interface JournalProps {
  project: Project;
  run: Run;
  journal?: Journal;
}

export function RunResult({ project, run, journal }: JournalProps) {
  const [screenshot, setScreenshot] = React.useState<Artifact | null>(null);
  const router = useRouter();

  const runTitle = journal?.entries.find((j) => j.type === 'title');
  const statusSeverity =
    run.status === 'passed' ? 'success' : run.status === 'failed' || run.status === 'error' ? 'danger' : 'info';

  const durationMs = run.startedAt && run.finishedAt ? run.finishedAt.getTime() - run.startedAt.getTime() : undefined;
  const duration = typeof durationMs === 'number' ? `${(durationMs / 1000).toFixed(1)}s` : undefined;

  const statusIcon = (status: RunStatus | undefined) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 size={14} />;
      case 'failed':
      case 'error':
        return <XCircle size={14} />;
      case 'running':
        return <Clock size={14} />;
    }
  };

  useEffect(() => {
    const fn = run.status === 'running' ? 'findLast' : 'find';
    const screenshot = journal?.entries[fn]((j) => j.type === 'success' || j.type === 'failure')?.screenshot;
    if (screenshot) setScreenshot(screenshot);
  }, [journal, run]);

  return (
    <div className="grid">
      <div className="col-12 mb-3">
        <BreadCrumb
          model={[{ label: project.title || 'Project', url: `/projects/${project.id}` }, { label: `Run #${run.id}` }]}
        />
      </div>

      {/* Left side - Screenshot and Info */}
      <div className="col-12 md:col-8">
        {/* Header */}
        <div className="flex align-items-center justify-content-between mb-3">
          <div>
            <h1 className="m-0 text-base text-white font-normal">{runTitle?.message ?? run.target}</h1>
            {run && (
              <div className="flex align-items-baseline gap-3 mt-3 mb-2">
                <div>
                  <i className="pi pi-globe mr-1" /> Chrome 120
                </div>
              </div>
            )}
          </div>
          <div className="flex align-items-center gap-2">
            {run && run.status !== 'queued' && run.status !== 'running' && (
              <Tag icon={statusIcon(run.status)} value={run.status} severity={statusSeverity} />
            )}
            {duration && <span className="text-500 mono">{duration}</span>}
          </div>
        </div>

        {/* Screenshot placeholder */}
        <Screenshot src={screenshot?.url} alt={screenshot?.name} width={1920} height={1080} />
      </div>

      {/* Right side - Run Timeline */}
      <div className="col-12 md:col-4 pl-6">
        <div className={styles.timeline}>
          {journal?.entries.length ? (
            <RunTimeline
              status={run.status}
              entries={journal.entries}
              onSelect={(entry) => setScreenshot(entry.screenshot ?? null)}
            />
          ) : (
            <RunTimelineSkeleton />
          )}
          {run.type === 'explore' && run.status === 'passed' && (
            <Button label="Continue" className="w-full mt-6" onClick={() => router.push(`/projects/${project.id}`)} />
          )}
        </div>
      </div>
    </div>
  );
}

export default RunResult;
