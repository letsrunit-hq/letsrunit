'use client';

import React, { useEffect } from 'react';
import type { Artifact, Journal, Project, Run } from '@letsrunit/model';
import { RunTimeline, RunTimelineSkeleton } from '@/components/run-timeline';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Tag } from 'primereact/tag';
import { Screenshot } from '@/components/screenshot';
import { cn } from '@letsrunit/utils';
import styles from './run-result.module.css';
import { Button } from 'primereact/button';
import { useRouter } from 'next/navigation';

export interface JournalProps {
  project: Project;
  run: Run;
  journal?: Journal;
}

export function RunResult({ project, run, journal }: JournalProps) {
  const [screenshot, setScreenshot] = React.useState<Artifact | null>(null);
  const router = useRouter();

  const items = [{ label: project.title || 'Project' }, { label: `Run #${run.id}` }];

  const runTitle = journal?.entries.find((j) => j.type === 'title');
  const statusSeverity =
    run.status === 'success' ? 'success' : run.status === 'failed' || run.status === 'error' ? 'danger' : 'info';

  const durationMs = run.startedAt && run.finishedAt ? run.finishedAt.getTime() - run.startedAt.getTime() : undefined;
  const duration = typeof durationMs === 'number' ? `${(durationMs / 1000).toFixed(1)}s` : undefined;

  useEffect(() => {
    setScreenshot(() => journal?.entries.findLast((j) => j.type === 'success')?.screenshot ?? null);
  }, [journal]);

  return (
    <div className="grid">
      <div className="col-12 mb-3">
        <BreadCrumb model={items} />
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
            {run && <Tag value={run.status} severity={statusSeverity as any} />}
            {duration && <span className="text-500 mono">{duration}</span>}
          </div>
        </div>

        {/* Screenshot placeholder */}
        <Screenshot image={screenshot?.url} alt={screenshot?.name} width={1920} height={1080} />

        {/* Description from project */}
        <div className="mt-4">
          <div className="flex align-items-center gap-2 text-500 mb-2">
            <div className={cn('flex-1', styles.lineIn)} />
            <span>Project Description</span>
            <div className={cn('flex-1', styles.lineOut)} />
          </div>
          <p className="text-600 line-height-3">{project.description ?? 'No description available.'}</p>
        </div>
      </div>

      {/* Right side - Run Timeline */}
      <div className="col-12 md:col-4 pl-6">
        <div className={styles.timeline}>
          {journal ? <RunTimeline entries={journal.entries} /> : <RunTimelineSkeleton />}
          {run.type === 'explore' && run.status === 'success' && (
            <Button label="Continue" className="w-full mt-6" onClick={() => router.push(`/projects/${project.accountId}/${project.id}`) } />
          )}
        </div>
      </div>
    </div>
  );
}

export default RunResult;
