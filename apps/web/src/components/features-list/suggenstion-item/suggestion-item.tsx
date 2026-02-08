import { RunStatusBadge } from '@/components/run-status-badge';
import { Tile } from '@/components/tile';
import type { Feature } from '@letsrunit/model';
import { cn } from '@letsrunit/utils';
import { ArchiveRestore, Lightbulb, X, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import { ProgressSpinner } from 'primereact/progressspinner';
import React from 'react';
import type { ActionFn } from '../types';

export interface SuggestionItemProps {
  feature: Feature;
  generate?: ActionFn;
  remove?: ActionFn;
  restore?: ActionFn;
}

export function SuggestionItem({ feature, generate, remove, restore }: SuggestionItemProps) {
  const router = useRouter();
  const status = feature.lastRun?.status;

  const generateButton =
    status === 'queued' || status === 'running' ? (
      <ProgressSpinner style={{ height: 32 }} strokeWidth="8" />
    ) : generate ? (
      <Button
        icon={feature.lastRun ? undefined : <Zap size={16} className="mr-2" />}
        label={feature.lastRun ? 'Retry' : 'Generate & Run'}
        severity={feature.lastRun ? 'secondary' : undefined}
        onClick={() => generate(feature)}
        className="flex-1"
      />
    ) : (
      <></>
    );

  const removeButton = remove && (
    <Button
      severity="secondary"
      text
      aria-label="Archive"
      title="Archive suggestion"
      icon={<X size={20} />}
      onClick={() => remove(feature)}
      disabled={status === 'queued' || status === 'running'}
    />
  );

  const restoreButton = restore && (
    <Button
      severity="secondary"
      text
      aria-label="Restore"
      title="Restore suggestion"
      icon={<ArchiveRestore size={20} />}
      onClick={() => restore(feature)}
    />
  );

  const openRun = () => {
    if (!feature.lastRun) return;
    router.push(`/runs/${feature.lastRun.id}`);
  };

  return (
    <Panel className="w-full even relative" role={feature.lastRun ? 'button' : undefined} onClick={openRun}>
      <div className="absolute text-blue-500 md:hidden" style={{ top: '0.75rem', right: '0.5rem' }}>
        <Lightbulb key="icon" size={20} />
      </div>
      <div className="flex flex-column sm:flex-row align-items-center justify-content-between gap-3">
        <div className="flex align-items-center gap-3">
          <Tile className="hidden md:flex tile-blue" icon={<Lightbulb key="icon" size={24} />} />
          <div className="flex flex-1 flex-column">
            <div className="flex align-items-center gap-2 mb-1">
              <h3 className={cn('m-0', 'mb-1', 'font-normal', !feature.enabled && 'line-through')}>{feature.name}</h3>
            </div>
            {feature.description && <p className="text-300 m-0">{feature.description}</p>}
          </div>
        </div>
        <div className="flex align-items-center gap-2 w-full sm:w-auto">
          <RunStatusBadge status={feature.lastRun?.status} />
          {feature.enabled && generateButton}
          {feature.enabled && removeButton}
          {!feature.enabled && restoreButton}
        </div>
      </div>
    </Panel>
  );
}

export default SuggestionItem;
