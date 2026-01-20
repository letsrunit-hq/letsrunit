import type { Feature } from '@letsrunit/model';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TestItem } from './test-item';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

function makeFeature(partial?: Partial<Feature>): Feature {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    projectId: '22222222-2222-2222-2222-222222222222',
    path: '/',
    name: 'My test',
    description: null,
    comments: null,
    body: null,
    enabled: true,
    lastRun: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    createdBy: null,
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    updatedBy: null,
    ...partial,
  };
}

describe('TestItem', () => {
  it('renders name and the Run button when idle', () => {
    const feature = makeFeature();
    const run = vi.fn();
    render(<TestItem feature={feature} run={run} />);
    expect(screen.getByText('My test')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /run/i })).toBeInTheDocument();
  });

  it('shows last run info when lastRun exists', () => {
    const feature = makeFeature({
      lastRun: {
        id: '33333333-3333-3333-3333-333333333333',
        type: 'test',
        status: 'passed',
        projectId: '22222222-2222-2222-2222-222222222222',
        featureId: '11111111-1111-1111-1111-111111111111',
        target: new URL('https://example.com') as unknown as string,
        error: null,
        startedAt: null,
        finishedAt: null,
        createdAt: new Date('2024-02-01T00:00:00Z'),
        createdBy: null,
        updatedAt: new Date('2024-02-01T00:00:00Z'),
        updatedBy: null,
      } as any,
    });

    const run = vi.fn();
    render(<TestItem feature={feature} run={run} />);
    expect(screen.getByText(/Last run/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /run/i })).toBeInTheDocument();
  });

  it('disables More and hides Run while running', () => {
    const feature = makeFeature({
      lastRun: {
        id: '44444444-4444-4444-4444-444444444444',
        type: 'test',
        status: 'running',
        projectId: '22222222-2222-2222-2222-222222222222',
        featureId: '11111111-1111-1111-1111-111111111111',
        target: new URL('https://example.com') as unknown as string,
        error: null,
        startedAt: null,
        finishedAt: null,
        createdAt: new Date('2024-02-01T00:00:00Z'),
        createdBy: null,
        updatedAt: new Date('2024-02-01T00:00:00Z'),
        updatedBy: null,
      } as any,
    });

    render(<TestItem feature={feature} run={vi.fn()} remove={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /run/i })).not.toBeInTheDocument();
    const more = screen.getByLabelText('More');
    expect(more).toBeDisabled();
  });
});
