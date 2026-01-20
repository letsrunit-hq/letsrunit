import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { RunHistory } from './run-history';

vi.mock('@/hooks/use-run-history', () => {
  const projectId = '11111111-1111-4111-8111-111111111111' as any;
  const now = new Date();
  const start = new Date(now.getTime() - 4200);
  const run = {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    type: 'test',
    projectId,
    featureId: null,
    target: 'https://example.com',
    status: 'passed',
    error: null,
    startedAt: start,
    finishedAt: now,
    createdAt: start,
    createdBy: null,
    updatedAt: now,
    updatedBy: null,
  } as any;

  const useRunHistory = () => ({ runs: [run], loading: false, error: undefined });
  return { __esModule: true, default: useRunHistory, useRunHistory };
});

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

describe('RunHistory', () => {
  const PROJECT_ID = '11111111-1111-4111-8111-111111111111' as any;

  it('renders run items with status, id and duration', () => {
    render(<RunHistory projectId={PROJECT_ID} />);

    // shows status via aria-label on Chip
    expect(screen.getByLabelText(/passed/i)).toBeInTheDocument();

    // shows short id (starts with #)
    expect(screen.getByText(/^#.+/)).toBeInTheDocument();

    // shows computed duration (approx 4.2s)
    expect(screen.getByText(/4s$/)).toBeInTheDocument();
  });
});
