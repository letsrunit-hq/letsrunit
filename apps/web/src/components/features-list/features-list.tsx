'use client';

import React, { useMemo, useState } from 'react';
import { Panel } from 'primereact/panel';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { CheckCircle2, Lightbulb, MoreVertical, Play, Plus, Search, TestTube, XCircle, Zap } from 'lucide-react';
import { Chip } from 'primereact/chip';
import { ProgressSpinner } from 'primereact/progressspinner';

export type FilterType = 'all' | 'suggestions' | 'tests';
export type TestStatus = 'passed' | 'failed' | 'pending' | 'none';

export interface Feature {
  id: string;
  type: 'suggestion' | 'test';
  title: string;
  description?: string;
  steps?: number;
  lastRun?: {
    status: TestStatus;
    timestamp: string;
  };
}

export type FeaturesListProps = {
  className?: string;
  features: Feature[];
};

function getStatusBadge(status: TestStatus) {
  switch (status) {
    case 'passed':
      return <Tag value="Passed" severity="success" icon={<CheckCircle2 size={14} />} />;
    case 'failed':
      return <Tag value="Failed" severity="danger" icon={<XCircle size={14} />} />;
    default:
      return null;
  }
}

export function FeaturesList({ className, features }: FeaturesListProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filterOptions = useMemo(
    () => [
      { label: 'All Features', value: 'all' as FilterType },
      { label: 'Suggestions', value: 'suggestions' as FilterType },
      { label: 'Tests', value: 'tests' as FilterType },
    ],
    [],
  );

  const filteredFeatures = useMemo(
    () =>
      features.filter((feature) => {
        const matchesFilter = filter === 'all' || feature.type === (filter === 'suggestions' ? 'suggestion' : 'test');
        const matchesSearch = feature.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
      }),
    [features, filter, searchQuery],
  );

  const Toolbar = () => (
    <div className="flex align-items-center gap-3 mb-4">
      {/* Search */}
      <IconField iconPosition="left" className="flex-1">
        <InputIcon>
          <Search size={16} />
        </InputIcon>
        <InputText
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search features..."
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
  );

  const CreateButton = () => (
    <button className="semantic">
      <Panel className="w-full primary border-dashed">
        <div className="flex align-items-center justify-content-between gap-3">
          <div className="flex align-items-center gap-3">
            <Chip className="tile tile-primary" icon={<Plus key="icon" size={24} />} />
            <h3 className="m-0 font-normal">Create custom test</h3>
          </div>
        </div>
      </Panel>
    </button>
  );

  const SuggestionItem = ({ feature }: { feature: Feature }) => (
    <Panel className="w-full even">
      <div className="flex align-items-center justify-content-between gap-3">
        <div className="flex align-items-center gap-3">
          <Chip className="tile tile-blue" icon={<Lightbulb key="icon" size={24} />} />
          <div className="flex flex-column">
            <div className="flex align-items-center gap-2 mb-1">
              <h3 className="m-0 mb-1 font-normal">{feature.title}</h3>
            </div>
            {feature.description && <p className="text-300 m-0">{feature.description}</p>}
          </div>
        </div>
        <div className="flex align-items-center gap-2">
          <Button>
            <Zap size={16} className="mr-2" />
            <span>Generate & Run</span>
          </Button>
          <Button severity="secondary" text aria-label="More" icon={<MoreVertical size={20} />} />
        </div>
      </div>
    </Panel>
  );

  const TestItem = ({ feature }: { feature: Feature }) => (
    <Panel className="w-full odd">
      <div className="flex align-items-center justify-content-between gap-3">
        <div className="flex align-items-center gap-3">
          <Chip className="tile tile-green" icon={<TestTube key="icon" size={24} />} />
          <div className="flex flex-column">
            <h3 className="m-0 mb-1 font-normal">{feature.title}</h3>
            <div className="flex align-items-center gap-3 text-300">
              {feature.lastRun && <span>Last run {feature.lastRun.timestamp}</span>}
            </div>
          </div>
        </div>
        <div className="flex align-items-center gap-2">
          {feature.lastRun && getStatusBadge(feature.lastRun.status)}
          {feature.lastRun?.status !== 'pending' && (
            <Button severity="secondary" className="ml-2">
              <Play size={16} className="mr-2" />
              <span>Run</span>
            </Button>
          )}
          {feature.lastRun?.status === 'pending' && (
            <ProgressSpinner style={{ height: 32 }} strokeWidth="8" />
          )}
          <Button severity="secondary" text aria-label="More" icon={<MoreVertical size={20} />}
                  disabled={feature.lastRun?.status === 'pending'} />
        </div>
      </div>
    </Panel>
  );

  return (
    <div className={className}>
      <Toolbar />

      <div className="flex flex-column gap-3">
        <CreateButton />

        {filteredFeatures.map((feature) =>
          feature.type === 'suggestion' ? (
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
