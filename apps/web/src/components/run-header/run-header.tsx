import type { Feature, Journal, Run, RunStatus } from '@letsrunit/model';
import { AreaGrid, AreaSlot } from 'areagrid';
import { CalendarClock, CheckCircle2, Clock, Globe2, Monitor, XCircle } from 'lucide-react';
import { Tag } from 'primereact/tag';
import React from 'react';
import LocalDateTime from '../local-date-time/local-date-time';

export type RunHeaderProps = {
  className?: string;
  run: Run;
  feature?: Feature | null;
  journal?: Journal;
};

export function RunHeader({ className, run, feature, journal }: RunHeaderProps) {
  const runTitle = journal?.entries.find((j) => j.type === 'name');
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

  return (
    <div className={className}>
      <AreaGrid
        areas={{
          base: `
            "title"
            "status"
            "description"
          `,
          md: `
            "title       status"
            "description status"
          `,
        }}
        columns={{
          base: '1fr',
          md: '1fr auto',
        }}
        gap="0.25rem 1rem"
        className="mb-3"
      >
        <AreaSlot name="title">
          <h1 className="m-0 text-base text-white font-normal">{runTitle?.message ?? feature?.name ?? run.target}</h1>
        </AreaSlot>

        <AreaSlot name="status">
          <div className="flex align-items-center gap-2 h-full mb-2 md:mb-0">
            {run && run.status !== 'queued' && run.status !== 'running' && (
              <Tag
                className="text-sm md:text-base"
                icon={statusIcon(run.status)}
                value={run.status}
                severity={statusSeverity}
              />
            )}
            {duration && <span className="text-500 mono text-sm md:text-base">{duration}</span>}
          </div>
        </AreaSlot>

        <AreaSlot name="description">
          {feature?.description && <div className="text-sm">{feature?.description}</div>}
        </AreaSlot>
      </AreaGrid>

      <div className="align-items-baseline gap-4 mb-3 text-sm hidden sm:flex">
        <div className="flex align-items-center gap-2">
          <Globe2 size={16} aria-hidden="true" /> <span>Chrome 120</span>
        </div>
        <div className="flex align-items-center gap-2">
          <Monitor size={16} aria-hidden="true" /> <span>1920&times;1080</span>
        </div>
        {run.startedAt && (
          <div className="flex align-items-center gap-2">
            <CalendarClock size={16} aria-hidden="true" />
            <LocalDateTime date={run.startedAt} />
          </div>
        )}
      </div>
    </div>
  );
}

export default RunHeader;
