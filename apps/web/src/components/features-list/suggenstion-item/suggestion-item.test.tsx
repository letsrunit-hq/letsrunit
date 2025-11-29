import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SuggestionItem } from './suggestion-item';
import type { Feature } from '@letsrunit/model';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

function makeFeature(partial?: Partial<Feature>): Feature {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    projectId: '00000000-0000-0000-0000-000000000002',
    path: '/',
    name: 'My suggestion',
    description: 'Some description',
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

describe('SuggestionItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows name, description and Generate & Run when no last run', () => {
    const feature = makeFeature();
    const generate = vi.fn();
    render(<SuggestionItem feature={feature} generate={generate} />);

    expect(screen.getByText('My suggestion')).toBeInTheDocument();
    expect(screen.getByText('Some description')).toBeInTheDocument();
    const buttonText = screen.getByText(/generate & run/i);
    expect(buttonText).toBeInTheDocument();
    const button = buttonText.closest('button');
    expect(button).not.toBeNull();
    fireEvent.click(button!);
    expect(generate).toHaveBeenCalledWith(feature);
  });

  it('shows Retry and navigates to run when clicked if lastRun exists', () => {
    const feature = makeFeature({
      lastRun: {
        id: '00000000-0000-0000-0000-000000000099',
        type: 'generate',
        status: 'passed',
        createdAt: new Date('2024-01-02T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:05:00Z'),
        projectId: '00000000-0000-0000-0000-000000000002',
        featureId: '00000000-0000-0000-0000-000000000001',
        target: new URL('https://example.com') as unknown as string,
        error: null,
        startedAt: null,
        finishedAt: null,
        createdBy: null,
        updatedBy: null,
      } as any,
    });

    render(<SuggestionItem feature={feature} generate={vi.fn()} />);

    const retryText = screen.getByText(/retry/i);
    expect(retryText).toBeInTheDocument();
    // clicking anywhere inside the panel should navigate
    fireEvent.click(screen.getByText('My suggestion'));
    expect(pushMock).toHaveBeenCalledWith('/runs/00000000-0000-0000-0000-000000000099');
  });

  it('shows Archive when enabled and disables it while running', () => {
    const feature = makeFeature({
      lastRun: { id: 'r1', type: 'generate', status: 'running', createdAt: new Date(), updatedAt: new Date(), projectId: 'p1', featureId: 'f1' } as any,
    });
    const remove = vi.fn();
    render(<SuggestionItem feature={feature} remove={remove} />);

    const archive = screen.getByLabelText('Archive');
    expect(archive).toBeDisabled();
  });

  it('shows Restore when feature is disabled', () => {
    const feature = makeFeature({ enabled: false });
    const restore = vi.fn();
    render(<SuggestionItem feature={feature} restore={restore} />);

    expect(screen.getByLabelText('Restore')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /generate & run/i })).not.toBeInTheDocument();
  });
});
