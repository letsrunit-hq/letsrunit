import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RunTimeline } from './run-timeline';
import { RunTimelineSkeleton } from '@/components/run-timeline/run-timeline-skeleton';

describe('RunTimeline', () => {
  it('renders the timeline heading and summary', () => {
    const baseEntry = {
      meta: {},
      artifacts: [],
      createdAt: 't',
    } as const;

    const entries = [
      { id: '1', type: 'success', message: 'Step success', duration: 1200, ...baseEntry },
      { id: '2', type: 'failure', message: 'Step failed', duration: 300, ...baseEntry },
      { id: '3', type: 'prepare', message: 'Preparing', ...baseEntry },
    ] as any; // keep loose for test simplicity

    render(<RunTimeline entries={entries} status="running" />);
    expect(screen.getByText('Test Steps')).toBeInTheDocument();
    expect(screen.getByText('1 of 3 completed')).toBeInTheDocument();
  });

  it('renders a skeleton timeline when loading', () => {
    render(<RunTimelineSkeleton />);
    // Heading still present
    expect(screen.getByText('Test Steps')).toBeInTheDocument();
    // Should render multiple skeleton elements
    expect(document.querySelectorAll('.p-skeleton').length).toBeGreaterThan(0);
  });
});
