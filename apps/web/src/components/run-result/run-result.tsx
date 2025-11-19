'use client';

import React from 'react';
import type { Journal, Project, Run } from '@letsrunit/model';
import { RunTimeline, RunTimelineSkeleton } from '@/components/run-timeline';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Tag } from 'primereact/tag';
import styles from './run-result.module.css';

export interface JournalProps {
  project: Project;
  run: Run;
  journal?: Journal;
}

export function RunResult({ project, run, journal }: JournalProps) {
  const items = [
    { label: project.title },
    { label: `Run #${run.id}` },
  ];

  const runTitle = journal?.entries.find((j) => j.type === 'title');

  const statusSeverity = run.status === 'success' ? 'success' : run.status === 'failed' || run.status === 'error' ? 'danger' : 'info';

  const durationMs = run.startedAt && run.finishedAt ? run.finishedAt.getTime() - run.startedAt.getTime() : undefined;
  const duration = typeof durationMs === 'number' ? `${(durationMs / 1000).toFixed(1)}s` : undefined;

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
            <h1 className="m-0 text-color">{runTitle?.message ?? run.target}</h1>
            {run && (
              <div className="text-500 mt-2">
                <span className="mono">{run.type.toUpperCase()}</span>
                <span className="mx-2">•</span>
                <span className="mono">{new URL(run.target).host}</span>
              </div>
            )}
          </div>
          <div className="flex align-items-center gap-2">
            {run && <Tag value={run.status} severity={statusSeverity as any} />}
            {duration && <span className="text-500 mono">{duration}</span>}
          </div>
        </div>

        {/* Screenshot placeholder */}
        <div className={styles.screenshotBox} />

        {/* Description from project */}
        <div className="mt-4">
          <div className="flex align-items-center gap-2 text-500 mb-2">
            <div className="flex-1 border-top-1 surface-border" />
            <span>Project Description</span>
            <div className="flex-1 border-top-1 surface-border" />
          </div>
          <p className="text-600 line-height-3">{project.description ?? 'No description available.'}</p>
        </div>
      </div>

      {/* Right side - Run Timeline */}
      <div className="col-12 md:col-4">
        { journal ? <RunTimeline entries={journal.entries} /> : <RunTimelineSkeleton /> }
      </div>
    </div>
  );
}

export default RunResult;
