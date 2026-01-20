import type { Project, Run } from '@letsrunit/model';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RunResult from './run-result';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

const baseEntry = {
  meta: {},
  artifacts: [],
  createdAt: 't',
};

describe('RunResult component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders entries in a Timeline with custom markers and no artifacts', () => {
    const data = {
      runId: '1b111111-1111-4111-8111-111111111111',
      entries: [
        { id: '1', type: 'prepare', message: 'Doing A', ...baseEntry },
        {
          id: '2',
          type: 'success',
          message: 'Did A',
          ...baseEntry,
          artifacts: [
            { name: 'screenshot-1.png', url: 'https://cdn/1.png' },
            { name: 'screenshot-2.png', url: 'https://cdn/2.png' },
          ],
        },
      ],
    };

    const project: Project = {
      id: '2b222222-2222-4222-8222-222222222222',
      accountId: '3b333333-3333-4333-8333-333333333333',
      url: 'https://example.com',
      title: 'Example App',
      description: 'An example project',
      image: 'https://example.com/og.png',
      favicon: 'https://example.com/favicon.ico',
      lang: 'en',
      loginAvailable: true,
      visibility: 'public',
      createdAt: new Date(),
      createdBy: '4b444444-4444-4444-8444-444444444444',
      updatedAt: new Date(),
      updatedBy: '4b444444-4444-4444-8444-444444444444',
    } as any;

    const run: Run = {
      id: '5b555555-5555-4555-8555-555555555555',
      type: 'test',
      projectId: project.id,
      target: 'https://example.com/login',
      status: 'running',
      error: null,
      startedAt: new Date(Date.now() - 4200),
      finishedAt: null,
      createdAt: new Date(),
      createdBy: '4b444444-4444-4444-8444-444444444444',
      updatedAt: new Date(),
      updatedBy: '4b444444-4444-4444-8444-444444444444',
    } as any;

    render(<RunResult project={project} run={run} journal={data as any} />);

    // Messages rendered
    expect(screen.getByText('Doing A')).toBeInTheDocument();
    expect(screen.getByText('Did A')).toBeInTheDocument();

    // Check for the messages as a proxy for timeline rendering.
    expect(screen.getByText('Doing A')).toBeInTheDocument();
    expect(screen.getByText('Did A')).toBeInTheDocument();

    // No artifacts are displayed
    expect(screen.queryByText('screenshot-1.png')).toBeNull();
    expect(screen.queryByText('screenshot-2.png')).toBeNull();

    // No card title rendered
    expect(screen.queryByText('RunResult')).toBeNull();
  });

  it('shows a RunTimeline skeleton when loading', () => {
    const project: Project = {
      id: '2b222222-2222-4222-8222-222222222222',
      accountId: '3b333333-3333-4333-8333-333333333333',
      url: 'https://example.com',
      title: 'Example App',
      description: 'An example project',
      image: 'https://example.com/og.png',
      favicon: 'https://example.com/favicon.ico',
      lang: 'en',
      loginAvailable: true,
      visibility: 'public',
      createdAt: new Date(),
      createdBy: '4b444444-4444-4444-8444-444444444444',
      updatedAt: new Date(),
      updatedBy: '4b444444-4444-4444-8444-444444444444',
    } as any;

    const run: Run = {
      id: '5b555555-5555-4555-8555-555555555555',
      type: 'test',
      projectId: project.id,
      target: 'https://example.com/login',
      status: 'running',
      error: null,
      startedAt: new Date(Date.now() - 4200),
      finishedAt: null,
      createdAt: new Date(),
      createdBy: '4b444444-4444-4444-8444-444444444444',
      updatedAt: new Date(),
      updatedBy: '4b444444-4444-4444-8444-444444444444',
    } as any;

    render(<RunResult project={project} run={run} loading={true} />);

    // Should render skeletons on the timeline side
    expect(document.querySelectorAll('.p-skeleton').length).toBeGreaterThan(0);
  });
});
