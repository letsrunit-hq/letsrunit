import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Page from './page';

vi.mock('@/libs/supabase/server', () => ({
  connect: vi.fn(async () => ({}) as any),
}));

vi.mock('@letsrunit/model', () => ({
  getProject: vi.fn(async () => ({
    id: 'p1',
    accountId: 'a1',
    url: 'https://example.com',
    title: 'My Project',
    description: null,
    image: null,
    favicon: null,
    screenshot: null,
    lang: 'en',
    loginAvailable: false,
    visibility: 'public',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    createdBy: null,
    updatedAt: new Date('2024-01-02T00:00:00Z'),
    updatedBy: null,
  })),
  listProjectFeaturesWithLastRun: vi.fn(async () => [
    {
      id: 'f1',
      projectId: 'p1',
      name: 'User Login Flow',
      description: 'check login',
      comments: null,
      body: null,
      lastRun: {
        id: 'r1',
        type: 'test',
        projectId: 'p1',
        featureId: 'f1',
        target: 'https://example.com',
        status: 'passed',
        error: null,
        startedAt: new Date('2024-01-03T10:00:00Z'),
        finishedAt: new Date('2024-01-03T10:01:00Z'),
        createdAt: new Date('2024-01-03T10:00:00Z'),
        createdBy: null,
        updatedAt: new Date('2024-01-03T10:01:00Z'),
        updatedBy: null,
      },
      createdAt: new Date('2024-01-01T00:00:00Z'),
      createdBy: null,
      updatedAt: new Date('2024-01-02T00:00:00Z'),
      updatedBy: null,
    },
  ]),
}));

describe('page projects/[id]', () => {
  const params = { id: 'p1' };

  it('renders project title and features', async () => {
    render(await Page({ params }));
    expect(screen.getByText('My Project')).toBeInTheDocument();
    expect(screen.getByText('User Login Flow')).toBeInTheDocument();
  });
});
