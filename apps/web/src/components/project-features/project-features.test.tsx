import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectFeatures } from './project-features';
import type { Feature } from '@letsrunit/model';

vi.mock('@/hooks/use-feature-list', async (orig) => {
  const actual: any = await orig();
  return {
    ...actual,
    useFeatureList: vi.fn(),
  };
});

const PROJECT_ID = '00000000-0000-0000-0000-000000000000' as const;

function makeFeature(partial: Partial<Feature> = {}): Feature {
  const now = new Date();
  return {
    id: '00000000-0000-0000-0000-000000000001',
    projectId: PROJECT_ID,
    name: 'F1',
    description: null,
    comments: null,
    body: 'Feature: x',
    enabled: true,
    lastRun: null,
    createdAt: now,
    createdBy: null,
    updatedAt: now,
    updatedBy: null,
    ...partial,
  };
}

describe('ProjectFeatures', () => {
  beforeEach(() => {
    const { useFeatureList } = require('@/hooks/use-feature-list');
    (useFeatureList as any).mockReturnValue({
      features: [
        makeFeature({ name: 'A', body: null }),
        makeFeature({ id: '...2', name: 'B', body: 'Feature: B', lastRun: { id: 'r', type: 'test', projectId: PROJECT_ID, featureId: '...2', target: 'http://x', status: 'passed', error: null, startedAt: null, finishedAt: null, createdAt: new Date(), createdBy: null, updatedAt: new Date(), updatedBy: null } as any }),
      ],
      loading: false,
      error: undefined,
    });
  });

  it('renders FeaturesList and StatsToolbar with computed stats', () => {
    render(<ProjectFeatures projectId={PROJECT_ID} />);

    // Feature names
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();

    // Stats
    expect(screen.getByText('Total Features')).toBeInTheDocument();
    expect(screen.getByText('Test cases')).toBeInTheDocument();
    expect(screen.getByText('Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Pass Rate')).toBeInTheDocument();

    // Values: total=2, tests=1, suggestions=1, passRate=100%
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getAllByText('1')).toHaveLength(2);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});
