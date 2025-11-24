'use client';

import React, { useMemo, useState } from 'react';
import { Panel } from 'primereact/panel';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { CheckCircle2, Lightbulb, MoreVertical, Play, Plus, Search, TestTube, X, XCircle, Zap } from 'lucide-react';
import { Chip } from 'primereact/chip';
import { ProgressSpinner } from 'primereact/progressspinner';
import type { Feature as ModelFeature, RunStatus } from '@letsrunit/model';
import TimeAgo from 'react-timeago';

export type FilterType = 'all' | 'suggestions' | 'tests';

export type FeaturesListProps = {
  className?: string;
  features: ModelFeature[];
};

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

const filterOptions = [
  { label: 'All', value: 'all' as FilterType },
  { label: 'Suggestions', value: 'suggestions' as FilterType },
  { label: 'Test Cases', value: 'tests' as FilterType },
];

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

const SuggestionItem = ({ feature }: { feature: ModelFeature }) => (
  <Panel className="w-full even">
    <div className="flex align-items-center justify-content-between gap-3">
      <div className="flex align-items-center gap-3">
        <Chip className="tile tile-blue" icon={<Lightbulb key="icon" size={24} />} />
        <div className="flex flex-column">
          <div className="flex align-items-center gap-2 mb-1">
            <h3 className="m-0 mb-1 font-normal">{feature.name}</h3>
          </div>
          {feature.description && <p className="text-300 m-0">{feature.description}</p>}
        </div>
      </div>
      <div className="hidden sm:flex align-items-center gap-2">
        <Button>
          <Zap size={16} className="mr-2" />
          <span>Generate & Run</span>
        </Button>
        <Button severity="secondary" text aria-label="Remove" icon={<X size={20} />} />
      </div>
    </div>
  </Panel>
);

const TestItem = ({ feature }: { feature: ModelFeature }) => {
  const status = feature.lastRun?.status;

  return (
    <Panel className="w-full odd">
      <div className="flex align-items-center justify-content-between gap-3">
        <div className="flex align-items-center gap-3">
          <Chip className="tile tile-green" icon={<TestTube key="icon" size={24} />} />
          <div className="flex flex-column">
            <h3 className="m-0 mb-1 font-normal">{feature.name}</h3>
            <div className="flex align-items-center gap-3 text-300">
              {feature.lastRun && <span>Last run <TimeAgo date={feature.lastRun.createdAt} /></span>}
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
          {(status === 'queued' || status === 'running') && (
            <ProgressSpinner style={{ height: 32 }} strokeWidth="8" />
          )}
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

export function FeaturesList({ className, features }: FeaturesListProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFeatures = useMemo(() => {
    return features.filter((feature) => {
      const isSuggestion = feature.body == null;
      const matchesFilter = filter === 'all' ? true : filter === 'suggestions' ? isSuggestion : !isSuggestion;
      const title = feature.name ?? '';
      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [features, filter, searchQuery]);

  return (
    <div className={className}>
      <div className="flex align-items-center gap-3 mb-4">
        {/* Search */}
        <IconField iconPosition="left" className="flex-1">
          <InputIcon>
            <Search size={16} />
          </InputIcon>
          <InputText
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full"
          />
        </IconField>

        {/* Filter */}
        <Dropdown
          value={filter}
          onChange={(e: DropdownChangeEvent) => setFilter(e.value as FilterType)}
          options={filterOptions}
          className="min-w-12rem"
          placeholder="Filter"
        />
      </div>

      <div className="flex flex-column gap-3">
        <CreateButton />

        {filteredFeatures.map((feature) =>
          feature.body == null ? (
            <SuggestionItem key={feature.id} feature={feature} />
          ) : (
            <TestItem key={feature.id} feature={feature} />
          ),
        )}
      </div>
    </div>
  );
}

export default FeaturesList;
