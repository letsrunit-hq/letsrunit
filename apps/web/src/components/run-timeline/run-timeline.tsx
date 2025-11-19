import React from 'react';
import { Timeline } from 'primereact/timeline';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';
import styles from './run-timeline.module.css';
import type { JournalEntry } from '@letsrunit/model';

type StepStatus = 'success' | 'failed' | 'pending';

interface RunStep {
  keyword: string;
  text: string;
  status: StepStatus;
  duration?: string;
}

interface ExtendedRunStep extends RunStep {
  isFirstPending?: boolean;
}

export interface RunTimelineProps {
  entries: JournalEntry[];
}

function mapTypeToStatus(t: JournalEntry['type']): StepStatus | null {
  switch (t) {
    case 'prepare':
      return 'pending';
    case 'success':
      return 'success';
    case 'failure':
      return 'failed';
    default:
      return null;
  }
}

function mapTypeToKeyword(t: JournalEntry['type']): string {
  switch (t) {
    case 'prepare':
      return 'Prepare';
    case 'success':
      return 'Success';
    case 'failure':
      return 'Failure';
    default:
      return '';
  }
}

function formatDuration(ms?: number): string | undefined {
  if (ms == null) return undefined;
  const seconds = ms / 1000;
  return `${seconds.toFixed(1)}s`;
}

function getStatusColor(status: StepStatus) {
  switch (status) {
    case 'success':
      return 'text-green-500';
    case 'failed':
      return 'text-red-500';
    case 'pending':
      return 'text-500';
  }
}

// Custom marker template for Timeline
function markerTemplate(item: ExtendedRunStep) {
  if (item.status === 'pending') {
    if (item.isFirstPending) {
      return (
        <div className={`flex align-items-center justify-content-center ${styles.markerBox}`}>
          <ProgressSpinner className={styles.spinner} strokeWidth="8" />
        </div>
      );
    }
    // Other pending steps – gray open circle
    return <span className="pi pi-circle text-500" aria-label="pending" />;
  }

  if (item.status === 'success') {
    return <span className="pi pi-check-circle text-green-500" aria-label="success" />;
  }

  // failed
  return <span className="pi pi-times-circle text-red-500" aria-label="failed" />;
}

// Custom content template for Timeline
function contentTemplate(item: ExtendedRunStep) {
  return (
    <div className="flex flex-column gap-1">
      <div className="flex align-items-baseline gap-2">
        <span className={`${getStatusColor(item.status)} mono`}>{item.keyword}</span>
        <span className="text-color">{item.text}</span>
      </div>
      {item.duration && <div className="text-500 mono">{item.duration}</div>}
    </div>
  );
}

export function RunTimeline({ entries }: RunTimelineProps) {
  // Filter to relevant entry types
  const filtered = entries.filter((e) => mapTypeToStatus(e.type) !== null);
  const steps: RunStep[] = filtered.map((e) => ({
    keyword: mapTypeToKeyword(e.type),
    text: e.message,
    status: mapTypeToStatus(e.type) as StepStatus,
    duration: formatDuration(e.duration),
  }));

  // Determine the first pending step to render a spinner for it
  const firstPendingIndex = steps.findIndex((s) => s.status === 'pending');
  const events: ExtendedRunStep[] = steps.map((s, i) => ({
    ...s,
    isFirstPending: firstPendingIndex >= 0 && i === firstPendingIndex,
  }));

  const testPassed = steps.length > 0 && steps.every((step) => step.status === 'success');
  const completed = steps.filter((s) => s.status === 'success').length;
  const total = steps.length;
  const passedCount = completed;
  const failedCount = steps.filter((s) => s.status === 'failed').length;

  return (
    <div className={styles.stickyBox}>
      <div className="mb-4">
        <h2 className="text-color mb-1">Test Steps</h2>
        <p className="text-500">
          {completed} of {total} completed
        </p>
      </div>

      <Timeline value={events} marker={markerTemplate} content={contentTemplate} />

      {/* Summary */}
      <div className="mt-4 pt-3 border-top-1 surface-border">
        <div className="flex align-items-center justify-content-between">
          <div className="flex align-items-center gap-2">
            <span className={`${styles.dot} ${styles.dotGreen}`} />
            <span className="text-500">{passedCount} Passed</span>
          </div>
          <div className="flex align-items-center gap-2">
            <span className={`${styles.dot} ${styles.dotRedWeak}`} />
            <span className="text-500">{failedCount} Failed</span>
          </div>
        </div>
      </div>

      {/* Continue button - only show if test passed */}
      {testPassed && <Button label="Continue" className="w-full mt-4" />}
    </div>
  );
}

export default RunTimeline;
