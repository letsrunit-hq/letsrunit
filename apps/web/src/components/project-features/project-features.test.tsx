import type { Feature } from '@letsrunit/model';
import { render, screen } from '@testing-library/react';
import type { UUID } from 'node:crypto';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectFeatures } from './project-features';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

vi.mock('@/context/toast-context', () => ({
  useToast: vi.fn(() => ({
    show: vi.fn(),
  })),
}));

vi.mock('@/hooks/use-feature-list', () => ({
  useFeatureList: vi.fn(),
}));

const PROJECT_ID = '00000000-0000-0000-0000-000000000000' as const;

function makeFeature(partial: Partial<Feature> = {}): Feature {
  const now = new Date();
  return {
    id: '00000000-0000-0000-0000-000000000001',
    projectId: PROJECT_ID,
    name: 'F1',
    path: '/',
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
  beforeEach(async () => {
    const { useFeatureList } = await import('@/hooks/use-feature-list');
    (useFeatureList as any).mockReturnValue({
      features: [
        makeFeature({ name: 'A', body: null }),
        makeFeature({
          id: '...2' as UUID,
          name: 'B',
          body: 'Feature: B',
          lastRun: {
            id: 'r',
            type: 'test',
            projectId: PROJECT_ID,
            featureId: '...2',
            target: 'http://x',
            status: 'passed',
            error: null,
            startedAt: null,
            finishedAt: null,
            createdAt: new Date(),
            createdBy: null,
            updatedAt: new Date(),
            updatedBy: null,
          } as any,
        }),
      ],
      loading: false,
      error: undefined,
    });
  });

  it('renders FeaturesList and StatsToolbar with computed stats', () => {
    render(<ProjectFeatures projectId={PROJECT_ID} baseUrl="https://example.com" />);

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
    // Use getAllByText for '1' because it appears for both Test cases and Suggestions
    expect(screen.getAllByText('1')).toHaveLength(2);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});
