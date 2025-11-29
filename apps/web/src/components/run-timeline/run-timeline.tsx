import { useTimelinePlayer } from '@/hooks/use-timeline-player';
import type { JournalEntry, RunStatus, RunType } from '@letsrunit/model';
import { cn, join } from '@letsrunit/utils';
import { CheckCircle2, Circle, CircleDot, Pause, Play, XCircle } from 'lucide-react';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Timeline } from 'primereact/timeline';
import React from 'react';
import styles from './run-timeline.module.css';

type StepStatus = 'pending' | 'running' | 'passed' | 'failed';

interface RunStep {
  keyword?: string;
  text: string;
  status: StepStatus;
  duration?: string;
  description?: string;
  hasScreenshot: boolean;
}

interface ExtendedRunStep extends RunStep {
  isFirstPending?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  selected?: boolean;
}

export interface RunTimelineProps {
  status: RunStatus;
  entries: JournalEntry[];
  onSelect?: (key: JournalEntry) => void;
  type?: RunType;
}

function mapTypeToStatus(t: JournalEntry['type']): StepStatus | null {
  switch (t) {
    case 'prepare':
      return 'pending';
    case 'start':
      return 'running';
    case 'success':
      return 'passed';
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
    case 'passed':
      return styles.textGreen;
    case 'failed':
      return styles.textRed;
  }
}

// Custom marker template for Timeline
function markerTemplate(item: ExtendedRunStep, runStatus: RunStatus) {
  if (item.status === 'passed') {
    return item.hasScreenshot
      ? <CircleDot className={cn(styles.statusIcon, styles.textGreen)} aria-label="success" />
      : <CheckCircle2 className={cn(styles.statusIcon, styles.textGreen)} aria-label="success" />;
  }

  if (item.status === 'failed') {
    return <XCircle className={cn(styles.statusIcon, styles.textRed)} aria-label="failed" />;
  }

  if (item.status === 'running' && runStatus === 'running') {
    return (
      <div className={cn('flex align-items-center justify-content-center', styles.markerBox)}>
        <ProgressSpinner className={styles.spinner} strokeWidth="8" />
      </div>
    );
  }

  return <Circle className={cn(styles.statusIcon, 'text-500')} aria-label="pending" />;
}

// Custom content template for Timeline
function contentTemplate(item: ExtendedRunStep) {
  return (
    <div
      className={cn(
        'flex flex-column gap-0 p-2 border-round',
        item.onClick ? 'cursor-pointer' : '',
        item.selected ? 'surface-50' : '',
      )}
      onClick={item.onClick}
      role={item.onClick ? 'button' : undefined}
      tabIndex={item.onClick ? 0 : undefined}
      aria-selected={item.selected}
    >
      <div className="flex align-items-baseline gap-1">
        {item.keyword && <span className={`${getStatusColor(item.status)} mono`}>{item.keyword}</span>}
        <span>{item.text}</span>
      </div>
      <div className="opacity-50 text-sm">{join(' — ', item.duration, item.description)}</div>
    </div>
  );
}

export function RunTimeline({ type, status, entries, onSelect }: RunTimelineProps) {
  // Filter to relevant entry types
  const filtered = entries.filter((e) => mapTypeToStatus(e.type) !== null);
  const steps: RunStep[] = filtered.map((e) => ({
    keyword: e.message.match(/^(Given|When|Then|And|But|\*)\s.*$/)?.[1],
    text: e.message.replace(/^(Given|When|Then|And|But|\*)\s+/, ''),
    status: mapTypeToStatus(e.type) as StepStatus,
    duration: formatDuration(e.duration),
    hasScreenshot: Boolean(e.screenshot),
    description: e.meta.description,
  }));

  // selection state
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

  // when status is not running, ensure first step is selected by default
  React.useEffect(() => {
    if (status !== 'running') {
      setSelectedIndex((prev) => (prev == null ? (steps.length > 0 ? 0 : null) : prev));
    } else {
      // when running, don't force selection changes
      setSelectedIndex((prev) => prev);
    }
  }, [status, steps.length]);

  const lastStep = steps[steps.length - 1];
  const showDetermining = status === 'running'
    && (type === 'explore' || type === 'generate')
    && (lastStep?.status === 'passed' || lastStep?.status === 'failed');
  const clickable = status !== 'running';
  const selectIndex = React.useCallback(
    (i: number) => {
      setSelectedIndex(i);
      if (onSelect) onSelect(filtered[i]);
    },
    [onSelect, filtered],
  );

  const total = steps.length;

  const { playing, toggle, pause } = useTimelinePlayer({
    enabled: Boolean(onSelect) && clickable,
    total,
    selectedIndex,
    selectIndex,
    delayMs: 1000,
    wrapOnStart: true,
    hasScreenshotAt: (i) => steps[i].hasScreenshot,
  });

  const events: ExtendedRunStep[] = steps.map((s, i) => ({
    ...s,
    selected: selectedIndex === i,
    onClick:
      onSelect && clickable
        ? () => {
            pause();
            selectIndex(i);
          }
        : undefined,
  }));

  const completed = steps.filter((s) => s.status === 'passed').length;
  const passedCount = completed;
  const failedCount = steps.filter((s) => s.status === 'failed').length;

  return (
    <>
      <div className="mb-4">
        <div className="flex align-items-center justify-content-between">
          <div>
            <h2 className="text-base text-white mb-2">Test Steps</h2>
            <p className="opacity-50 m-0">
              {completed} of {total} completed
            </p>
          </div>
          {onSelect && status !== 'running' && (
            <Button
              outlined
              icon={playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
              aria-label={playing ? 'Pause' : 'Play'}
              onClick={toggle}
            />
          )}
        </div>
      </div>

      <Timeline
        value={events}
        marker={(step) => markerTemplate(step, status)}
        content={(item) => contentTemplate(item)}
        align="left"
        className="run-timeline"
        pt={{ opposite: { className: 'hidden' } }}
      />

      {showDetermining && (
        <div className="p-3 my-3 border-1 border-round surface-border flex align-items-center gap-3 surface-50">
          <div className={cn('flex align-items-center justify-content-center', styles.markerBox)}>
            <ProgressSpinner className={styles.spinner} strokeWidth="8" />
          </div>
          <div className="flex flex-column">
            <span className="font-medium">Determining next steps…</span>
            <span className="text-500 text-sm">Analyzing results to plan the following action</span>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mt-4 pt-4 border-top-1 subtle-border">
        <div className="flex align-items-center justify-content-between">
          <div className="flex align-items-center gap-2">
            <span className={cn(styles.dot, styles.dotGreen, failedCount > 0 && 'opacity-30')} />
            <span className="text-500">{passedCount} Passed</span>
          </div>
          <div className="flex align-items-center gap-2">
            <span className={cn(styles.dot, styles.dotRed, failedCount === 0 && 'opacity-30')} />
            <span className="text-500">{failedCount} Failed</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default RunTimeline;
