import { Tile } from '@/components/tile';
import type { Feature } from '@letsrunit/model';
import { cn } from '@letsrunit/utils';
import { Archive, ArchiveRestore, CheckCircle2, MoreVertical, Play, RefreshCcw, TestTube, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';
import type { MenuItem } from 'primereact/menuitem';
import { Panel } from 'primereact/panel';
import { ProgressSpinner } from 'primereact/progressspinner';
import React from 'react';
import TimeAgo from 'react-timeago';
import RunStatusBadge from '../../run-status-badge/run-status-badge';
import type { ActionFn } from '../types';

export interface TestItemProps {
  feature: Feature;
  run?: ActionFn;
  generate?: ActionFn;
  remove?: ActionFn;
  restore?: ActionFn;
}

export function TestItem({ feature, run, generate, remove, restore }: TestItemProps) {
  const router = useRouter();
  const menuRef = React.useRef<Menu>(null);

  const status = feature.lastRun?.status;

  const items = React.useMemo<MenuItem[]>(() => {
    const list: MenuItem[] = [];
    if (generate) {
      list.push({
        id: 'regenerate',
        label: 'Regenerate',
        icon: <RefreshCcw size={14} className="p-menuitem-icon" />,
        command: () => generate(feature),
      });
    }
    if (remove) {
      list.push({
        id: 'archive',
        label: 'Archive',
        icon: <Archive size={14} className="p-menuitem-icon" />,
        command: () => remove(feature),
      });
    }
    return list;
  }, [feature, generate, remove]);

  const runButton =
    status === 'queued' || status === 'running' ? (
      <ProgressSpinner style={{ height: 32 }} strokeWidth="8" />
    ) : run ? (
      <Button
        severity="secondary"
        className="ml-2"
        icon={<Play size={16} className="mr-2" />}
        label="Run"
        onClick={() => run(feature)}
      />
    ) : (
      <></>
    );

  const moreMenu =
    items.length > 0 ? (
      <>
        <Menu model={items} popup ref={menuRef} />
        <Button
          severity="secondary"
          text
          aria-label="More"
          icon={<MoreVertical size={20} />}
          disabled={status === 'queued' || status === 'running'}
          onClick={(e) => menuRef.current?.toggle(e)}
        />
      </>
    ) : (
      <></>
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
    <Panel className="w-full odd relative">
      <div className="absolute text-blue-500 md:hidden" style={{ top: '0.75rem', right: '0.5rem' }}>
        {feature.lastRun?.status === 'passed' && <CheckCircle2 className="text-green-500" size={20} />}
        {feature.lastRun?.status === 'error' && <XCircle className="text-red-500" size={20} />}
        {feature.lastRun?.status === 'failed' && <XCircle className="text-red-500" size={20} />}
      </div>
      <div className="flex align-items-center justify-content-between gap-3">
        <div
          className="flex flex-1 align-items-center gap-3"
          role={feature.lastRun ? 'link' : undefined}
          onClick={openRun}
        >
          <Tile className="hidden md:flex tile-green" icon={<TestTube key="icon" size={24} />} />
          <div className="flex flex-1 flex-column">
            <h3 className={cn('m-0', 'mb-1', 'font-normal', !feature.enabled && 'line-through')}>{feature.name}</h3>
            <div className="flex align-items-center gap-3 text-300">
              {feature.lastRun && (
                <span>
                  Last run <TimeAgo date={feature.lastRun.createdAt} live={false} />
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="hidden sm:flex align-items-center gap-2">
          <RunStatusBadge className="hidden md:flex" status={feature.lastRun?.status} />
          {feature.enabled && runButton}
          {feature.enabled && moreMenu}
          {!feature.enabled && restoreButton}
        </div>
      </div>
    </Panel>
  );
}

export default TestItem;
