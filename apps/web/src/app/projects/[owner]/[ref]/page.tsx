'use client';

import React, { useState } from 'react';
import { Panel } from 'primereact/panel';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Lightbulb, MoreVertical, Play, Plus, Search, TestTube, Zap } from 'lucide-react';
import styles from './page.module.css';
import { cn } from '@letsrunit/utils';

type FilterType = 'all' | 'suggestions' | 'tests';
type TestStatus = 'passed' | 'failed' | 'pending' | 'none';

interface Feature {
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

const features: Feature[] = [
  {
    id: '1',
    type: 'test',
    title: 'User Login Flow',
    steps: 6,
    lastRun: { status: 'passed', timestamp: '2 min ago' },
  },
  {
    id: '2',
    type: 'suggestion',
    title: 'Password Reset Journey',
    description: 'Test the complete password reset flow including email verification',
  },
  {
    id: '3',
    type: 'test',
    title: 'Product Search & Filter',
    steps: 8,
    lastRun: { status: 'passed', timestamp: '1 hour ago' },
  },
  {
    id: '4',
    type: 'suggestion',
    title: 'Checkout with Multiple Items',
    description: 'Verify cart functionality with multiple products and variants',
  },
  {
    id: '5',
    type: 'test',
    title: 'User Registration',
    steps: 5,
    lastRun: { status: 'failed', timestamp: '3 hours ago' },
  },
  {
    id: '6',
    type: 'suggestion',
    title: 'Social Media Login Integration',
    description: 'Test OAuth login with Google, Facebook, and GitHub',
  },
  {
    id: '7',
    type: 'test',
    title: 'Add to Cart & Quantity Update',
    steps: 7,
    lastRun: { status: 'passed', timestamp: '5 hours ago' },
  },
  {
    id: '8',
    type: 'suggestion',
    title: 'Guest Checkout Flow',
    description: 'Allow users to complete purchase without registration',
  },
];

function getStatusBadge(status: TestStatus) {
  switch (status) {
    case 'passed':
      return <Tag value="Passed" severity="success" />;
    case 'failed':
      return <Tag value="Failed" severity="danger" />;
    case 'pending':
      return <Tag value="Pending" severity="warning" />;
    default:
      return null;
  }
}

export default function Page() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFeatures = features.filter((feature) => {
    const matchesFilter = filter === 'all' || feature.type === (filter === 'suggestions' ? 'suggestion' : 'test');
    const matchesSearch = feature.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filterOptions = [
    { label: 'All Features', value: 'all' as FilterType },
    { label: 'Suggestions', value: 'suggestions' as FilterType },
    { label: 'Tests', value: 'tests' as FilterType },
  ];

  return (
    <div className={`${styles.container} p-4 md:p-6 lg:p-7`}>
      {/* Header */}
      <div className="mb-4">
        <h1 className={styles.title}>E-Commerce Platform</h1>
        <p className={styles.muted}>Manage and run your test suite</p>
      </div>

      {/* Toolbar */}
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

      {/* Feature List */}
      <div className="flex flex-column gap-3">
        {/* Create Custom Test */}
        <Panel className="w-full primary border-dashed">
          <div className="flex align-items-center justify-content-between gap-3">
            <div className="flex align-items-center gap-3">
              <div className={`${styles.iconTile} ${styles.iconOrange}`}>
                <Plus size={20} />
              </div>
              <h3 className="m-0 font-normal">Create custom test</h3>
            </div>
            <div className="flex align-items-center gap-2">
            </div>
          </div>
        </Panel>

        {/* Features */}
        {filteredFeatures.map((feature) => (
          <Panel key={feature.id} className={`w-full ${feature.type === 'suggestion' ? 'alt' : ''}`}>
            {feature.type === 'suggestion' ? (
              <div className="flex align-items-center justify-content-between gap-3">
                <div className="flex align-items-center gap-3">
                  <div className={`${styles.iconTile} ${styles.iconBlue}`}>
                    <Lightbulb size={20} />
                  </div>
                  <div className="flex flex-column">
                    <div className="flex align-items-center gap-2 mb-1">
                      <h3 className="m-0 font-normal">{feature.title}</h3>
                    </div>
                    {feature.description && <p className={cn(styles.muted, 'm-0')}>{feature.description}</p>}
                  </div>
                </div>
                <div className="flex align-items-center gap-2">
                  <Button severity="warning">
                    <Zap size={16} className="mr-2" />
                    <span>Generate & Run</span>
                  </Button>
                  <Button severity="secondary" text rounded aria-label="More" icon={<MoreVertical size={16} />} />
                </div>
              </div>
            ) : (
              <div className="flex align-items-center justify-content-between gap-3">
                <div className="flex align-items-center gap-3">
                  <div className={`${styles.iconTile} ${styles.iconGreen}`}>
                    <TestTube size={20} />
                  </div>
                  <div className="flex flex-column">
                    <h3 className="m-0 font-normal">{feature.title}</h3>
                    <div className="flex align-items-center gap-3">
                      <span className={styles.muted}>{feature.steps} steps</span>
                      {feature.lastRun && <span className={styles.muted}>•</span>}
                      {feature.lastRun && <span className={styles.muted}>Last run {feature.lastRun.timestamp}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex align-items-center gap-2">
                  {feature.lastRun && getStatusBadge(feature.lastRun.status)}
                  <Button severity="secondary" outlined>
                    <Play size={16} className="mr-2" />
                    <span>Run</span>
                  </Button>
                  <Button severity="secondary" text rounded aria-label="More" icon={<MoreVertical size={16} />} />
                </div>
              </div>
            )}
          </Panel>
        ))}
      </div>

      {/* Stats Footer */}
      <div className="mt-5 pt-4 text-center" style={{ borderTop: '1px solid var(--surface-border)' }}>
        <div className="grid grid-nogutter md:col-12">
          <div className="col-12 md:col-3">
            <div className={cn(styles.muted, 'mb-2')}>Total Features</div>
            <div className={styles.statValue}>{features.length}</div>
          </div>
          <div className="col-12 md:col-3">
            <div className={cn(styles.muted, 'mb-2')}>Active Tests</div>
            <div className={styles.statValue}>{features.filter((f) => f.type === 'test').length}</div>
          </div>
          <div className="col-12 md:col-3">
            <div className={cn(styles.muted, 'mb-2')}>Suggestions</div>
            <div className={styles.statValue}>{features.filter((f) => f.type === 'suggestion').length}</div>
          </div>
          <div className="col-12 md:col-3">
            <div className={cn(styles.muted, 'mb-2')}>Pass Rate</div>
            <div className={styles.passRate}>75%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
