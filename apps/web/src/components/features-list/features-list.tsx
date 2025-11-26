import type { Feature, RunStatus } from '@letsrunit/model';
import { cn } from '@letsrunit/utils';
import {
  ArchiveRestore,
  CheckCircle2,
  Lightbulb,
  MoreVertical,
  Play,
  Plus,
  TestTube,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { Button } from 'primereact/button';
import { Chip } from 'primereact/chip';
import { Panel } from 'primereact/panel';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import React from 'react';
import TimeAgo from 'react-timeago';

type ActionFn = (feature: Feature) => void;

export interface FeaturesListProps {
  className?: string;
  features: Feature[];
  remove?: ActionFn;
  restore?: ActionFn;
}

function getStatusBadge(status: RunStatus | undefined) {
  switch (status) {
    case 'passed':
      return <Tag value="Passed" severity="success" icon={<CheckCircle2 size={14} />} />;
    case 'failed':
      return <Tag value="Failed" severity="danger" icon={<XCircle size={14} />} />;
    case 'error':
      return <Tag value="Error" severity="danger" icon={<XCircle size={14} />} />;
    default:
      return null;
  }
}

const CreateButton = () => (
  <Panel role="button" className="w-full primary border-dashed">
    <div className="flex align-items-center justify-content-between gap-3">
      <div className="flex align-items-center gap-3">
        <Chip className="tile tile-primary" icon={<Plus key="icon" size={24} />} />
        <h3 className="m-0 font-normal">Create a new test</h3>
      </div>
    </div>
  </Panel>
);

const SuggestionItem = ({ feature, remove, restore }: { feature: Feature; remove?: ActionFn; restore?: ActionFn }) => (
  <Panel className="w-full even">
    <div className="flex align-items-center justify-content-between gap-3">
      <div className="flex align-items-center gap-3">
        <Chip className="tile tile-blue" icon={<Lightbulb key="icon" size={24} />} />
        <div className="flex flex-column">
          <div className="flex align-items-center gap-2 mb-1">
            <h3 className={cn('m-0', 'mb-1', 'font-normal', !feature.enabled && 'line-through')}>{feature.name}</h3>
          </div>
          {feature.description && <p className="text-300 m-0">{feature.description}</p>}
        </div>
      </div>
      <div className="hidden sm:flex align-items-center gap-2">
        {feature.enabled && (
          <>
            <Button icon={<Zap size={16} className="mr-2" />}>Generate &amp; Run</Button>
            {remove && (
              <Button
                severity="secondary"
                text
                aria-label="Archive"
                title="Archive suggestion"
                icon={<X size={20} />}
                onClick={() => remove(feature)}
              />
            )}
          </>
        )}
        {!feature.enabled && restore && (
          <Button
            severity="secondary"
            text
            aria-label="Restore"
            title="Restore suggestion"
            icon={<ArchiveRestore size={20} />}
            onClick={() => restore(feature)}
          />
        )}
      </div>
    </div>
  </Panel>
);

const TestItem = ({ feature }: { feature: Feature }) => {
  const status = feature.lastRun?.status;

  return (
    <Panel className="w-full odd">
      <div className="flex align-items-center justify-content-between gap-3">
        <div className="flex align-items-center gap-3">
          <Chip className="tile tile-green" icon={<TestTube key="icon" size={24} />} />
          <div className="flex flex-column">
            <h3 className="m-0 mb-1 font-normal">{feature.name}</h3>
            <div className="flex align-items-center gap-3 text-300">
              {feature.lastRun && (
                <span>
                  Last run <TimeAgo date={feature.lastRun.createdAt} />
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="hidden sm:flex align-items-center gap-2">
          {feature.lastRun && getStatusBadge(status)}
          {status !== 'queued' && status !== 'running' && (
            <Button severity="secondary" className="ml-2">
              <Play size={16} className="mr-2" />
              <span>Run</span>
            </Button>
          )}
          {(status === 'queued' || status === 'running') && <ProgressSpinner style={{ height: 32 }} strokeWidth="8" />}
          <Button
            severity="secondary"
            text
            aria-label="More"
            icon={<MoreVertical size={20} />}
            disabled={status === 'queued' || status === 'running'}
          />
        </div>
      </div>
    </Panel>
  );
};

export function FeaturesList({ className, features, remove, restore }: FeaturesListProps) {
  return (
    <div className={className}>
      <div className="flex flex-column gap-3">
        <CreateButton />

        {features.map((feature) =>
          feature.body == null ? (
            <SuggestionItem key={feature.id} feature={feature} remove={remove} restore={restore} />
          ) : (
            <TestItem key={feature.id} feature={feature} />
          ),
        )}
      </div>
    </div>
  );
}

export default FeaturesList;
