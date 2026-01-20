'use client';

import { RunTimeline, RunTimelineSkeleton } from '@/components/run-timeline';
import { Screenshot } from '@/components/screenshot';
import type { Artifact, Feature, Journal, Project, Run, RunStatus } from '@letsrunit/model';
import { CalendarClock, CheckCircle2, Clock, Globe2, Monitor, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import React, { useEffect } from 'react';
import styles from './run-result.module.css';

export interface JournalProps {
  project?: Project;
  feature?: Feature | null;
  run: Run;
  journal?: Journal;
  loading?: boolean;
  children?: React.ReactNode;
}

export function RunResult({ project, feature, run, journal, loading, children }: JournalProps) {
  const [screenshot, setScreenshot] = React.useState<Artifact | null>(null);
  const router = useRouter();

  const runTitle = journal?.entries.find((j) => j.type === 'title');
  const statusSeverity =
    run.status === 'passed' ? 'success' : run.status === 'failed' || run.status === 'error' ? 'danger' : 'info';

  const durationMs = run.startedAt && run.finishedAt ? run.finishedAt.getTime() - run.startedAt.getTime() : undefined;
  const duration = typeof durationMs === 'number' ? `${(durationMs / 1000).toFixed(1)}s` : undefined;

  const description = run.type === 'explore' ? project?.description : feature?.description;

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
    if (run.status !== 'running') return;
    const entry = journal?.entries.findLast((e) => e.screenshot);
    if (entry) setScreenshot(entry.screenshot!);
  }, [run.status, journal?.entries]);

  return (
    <div className="grid">
      {/* Left side - Screenshot and Info */}
      <div className="col-12 md:col-8">
        {/* Header */}
        <div className="flex align-items-center justify-content-between mb-3 gap-2">
          <div>
            <h1 className="m-0 text-base text-white font-normal">{runTitle?.message ?? feature?.name ?? run.target}</h1>

            {description && <div className="mt-1 text-sm">{description}</div>}
          </div>
          <div className="flex align-items-center gap-2">
            {run && run.status !== 'queued' && run.status !== 'running' && (
              <Tag icon={statusIcon(run.status)} value={run.status} severity={statusSeverity} />
            )}
            {duration && <span className="text-500 mono">{duration}</span>}
          </div>
        </div>

        <div className="flex align-items-baseline gap-4 mb-3 text-sm">
          <div className="flex align-items-center gap-2">
            <Globe2 size={16} aria-hidden="true" /> <span>Chrome 120</span>
          </div>
          <div className="flex align-items-center gap-2">
            <Monitor size={16} aria-hidden="true" /> <span>1920&times;1080</span>
          </div>
          {run.startedAt && (
            <div className="flex align-items-center gap-2">
              <CalendarClock size={16} aria-hidden="true" />
              <span>
                {run.startedAt.toLocaleString('en-UK', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
        </div>

        {/* Screenshot placeholder */}
        <Screenshot src={screenshot?.url} alt={screenshot?.name} width={1920} height={1080} />

        {children}
      </div>

      {/* Right side - Run Timeline */}
      <div className="col-12 md:col-4 pl-6">
        <div className={styles.timeline}>
          {loading && <RunTimelineSkeleton />}
          {!loading && (
            <RunTimeline
              type={run.type}
              status={run.status}
              entries={journal?.entries ?? []}
              onSelect={(entry) => setScreenshot(entry.screenshot ?? null)}
            />
          )}
          {run.type === 'explore' && run.status === 'passed' && project && (
            <Button label="Continue" className="w-full mt-6" onClick={() => router.push(`/projects/${project.id}`)} />
          )}
        </div>
      </div>
    </div>
  );
}

export default RunResult;
