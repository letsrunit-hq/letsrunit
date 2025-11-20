import React from 'react';
import { Timeline } from 'primereact/timeline';
import { ProgressSpinner } from 'primereact/progressspinner';
import styles from './run-timeline.module.css';
import type { JournalEntry } from '@letsrunit/model';
import { cn } from '@letsrunit/utils';

type StepStatus = 'success' | 'failed' | 'pending';

interface RunStep {
  keyword?: string;
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

function formatDuration(ms?: number): string | undefined {
  if (ms == null) return undefined;
  const seconds = ms / 1000;
  return `${seconds.toFixed(1)}s`;
}

function getStatusColor(status: StepStatus) {
  switch (status) {
    case 'success':
      return styles.textGreen;
    case 'failed':
      return styles.textRed;
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
    return <span className={cn('pi', 'pi-circle-fill', styles.textGreen)} aria-label="success" />;
  }

  // failed
  return <span className={cn('pi', 'pi-times-circle', styles.textRed)} aria-label="failed" />;
}

// Custom content template for Timeline
function contentTemplate(item: ExtendedRunStep) {
  return (
    <div className="flex flex-column gap-1">
      <div className="flex align-items-baseline gap-1">
        {item.keyword && <span className={`${getStatusColor(item.status)} mono`}>{item.keyword}</span>}
        <span>{item.text}</span>
      </div>
      {item.duration && <div className="opacity-50 text-sm">{item.duration}</div>}
    </div>
  );
}

export function RunTimeline({ entries }: RunTimelineProps) {
  // Filter to relevant entry types
  const filtered = entries.filter((e) => mapTypeToStatus(e.type) !== null);
  const steps: RunStep[] = filtered.map((e) => ({
    keyword: e.message.match(/^(Given|When|Then|And|But|\*)\s.*$/)?.[1],
    text: e.message.replace(/^(Given|When|Then|And|But|\*)\s+/, ''),
    status: mapTypeToStatus(e.type) as StepStatus,
    duration: formatDuration(e.duration),
  }));

  // Determine the first pending step to render a spinner for it
  const firstPendingIndex = steps.findIndex((s) => s.status === 'pending');
  const events: ExtendedRunStep[] = steps.map((s, i) => ({
    ...s,
    isFirstPending: firstPendingIndex >= 0 && i === firstPendingIndex,
  }));

  const completed = steps.filter((s) => s.status === 'success').length;
  const total = steps.length;
  const passedCount = completed;
  const failedCount = steps.filter((s) => s.status === 'failed').length;

  return (
    <>
      <div className="mb-4">
        <h2 className="text-base text-white mb-2">Test Steps</h2>
        <p className="opacity-50 m-0">
          {completed} of {total} completed
        </p>
      </div>

      <Timeline
        value={events}
        marker={markerTemplate}
        content={contentTemplate}
        align="left"
        pt={{ opposite: { className: 'hidden' } }}
      />

      {/* Summary */}
      <div className="mt-4 pt-4 border-top-1 subtle-border">
        <div className="flex align-items-center justify-content-between">
          <div className="flex align-items-center gap-2">
            <span className={cn(styles.dot, styles.dotGreen, failedCount > 0 ? 'opacity-30' : '')} />
            <span className="text-500">{passedCount} Passed</span>
          </div>
          <div className="flex align-items-center gap-2">
            <span className={cn(styles.dot, styles.dotRed, failedCount === 0 ? 'opacity-30' : '')} />
            <span className="text-500">{failedCount} Failed</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default RunTimeline;
