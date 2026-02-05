'use client';

import { Tile } from '@/components/tile';
import useRunHistory from '@/hooks/use-run-history';
import { formatDurationMs } from '@/libs/date-time';
import type { Run, RunType } from '@letsrunit/model';
import type { UUID } from '@letsrunit/utils';
import { cn } from '@letsrunit/utils';
import { title } from 'case';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Panel } from 'primereact/panel';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import React, { useCallback } from 'react';
import TimeAgo from 'react-timeago';
import styles from './run-history.module.css';

export type RunHistoryProps = {
  className?: string;
  projectId: UUID;
  type?: RunType;
  featureId?: UUID;
  runs?: Run[];
  currentRunId?: UUID;
  showName?: boolean;
};

export function RunHistory({
  className,
  projectId,
  featureId,
  type,
  runs: initial,
  currentRunId,
  showName,
}: RunHistoryProps) {
  const router = useRouter();
  const { runs, loading } = useRunHistory({ projectId, featureId, type }, initial);

  const goto = useCallback((run: Run) => void router.push(`/runs/${run.id}`), [router]);

  if (loading) return null;

  if (runs.length === 0) {
    return <div className={cn(styles.container, className)}>No runs yet</div>;
  }

  return (
    <div className={cn(styles.container, className)}>
      {runs.map((run) => {
        return (
          <Panel
            className={cn('w-full slim even', run.id === currentRunId && 'selected')}
            key={run.id}
            role="button"
            onClick={() => goto(run)}
          >
            <div className="flex align-items-center justify-content-between gap-3">
              <div className="flex align-items-center gap-3">
                {run.status !== 'queued' && run.status !== 'running' && (
                  <Tile
                    size="sm"
                    className={cn('hidden sm:flex', run.status === 'passed' ? 'tile-green' : 'tile-red')}
                    aria-label={run.status}
                    icon={
                      run.status === 'passed' ? <CheckCircle2 key="icon" size={20} /> : <XCircle key="icon" size={20} />
                    }
                  />
                )}
                {(run.status === 'queued' || run.status === 'running') && (
                  <ProgressSpinner style={{ width: 38, height: 38 }} strokeWidth="8" />
                )}
                <div className="min-w-0">
                  <div className={cn(styles.title, 'flex align-items-center gap-2')}>
                    {showName && <span className="text-900">{run.name || title(run.type)}</span>}
                    {!showName && <span className="mono text-sm text-400 max-w-10rem md:max-w-max">#{run.id}</span>}

                    {run.type === 'generate' && <Tag className="text-xs" value={run.type} />}
                    {run.status === 'error' && <Tag className="text-xs" value="error" severity="danger" />}
                  </div>
                  <div className={cn(styles.meta, 'text-400 text-xs')}>
                    {showName && <span className="mono">#{run.id}</span>}
                    {!showName && <TimeAgo date={run.startedAt || run.createdAt} live={false} />}
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  styles.right,
                  'text-right text-500',
                  !showName && run.status === 'passed' && 'text-green-500',
                  !showName && (run.status === 'failed' || run.status === 'error') && 'text-red-500',
                )}
              >
                {!showName && run.finishedAt && formatDurationMs(run.startedAt, run.finishedAt)}
                {showName && <TimeAgo date={run.startedAt || run.createdAt} live={false} />}
              </div>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

export default RunHistory;
