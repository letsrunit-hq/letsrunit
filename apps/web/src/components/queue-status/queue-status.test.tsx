import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { QueueStatus } from './queue-status';

describe('QueueStatus', () => {
  it('renders', () => {
    render(<QueueStatus />);
    expect(screen.getByText(/Request Queued/)).toBeInTheDocument();
  });

  it('shows taking longer message when startTime is more than 1 minute ago', () => {
    const oneMinuteAndOneSecondAgo = new Date(Date.now() - 61 * 1000);
    render(<QueueStatus startTime={oneMinuteAndOneSecondAgo} />);
    expect(screen.getByText(/this is taking longer than expected/i)).toBeInTheDocument();
  });

  it('does not show taking longer message when startTime is less than 1 minute ago', () => {
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    render(<QueueStatus startTime={thirtySecondsAgo} />);
    expect(screen.queryByText(/this is taking longer than expected/i)).not.toBeInTheDocument();
  });

  it('updates when time passes', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    const startTime = new Date(now - 55 * 1000); // 55 seconds ago
    render(<QueueStatus startTime={startTime} />);

    expect(screen.queryByText(/this is taking longer than expected/i)).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(10 * 1000); // Advance 10 seconds, making it 65 seconds total
    });

    expect(screen.getByText(/this is taking longer than expected/i)).toBeInTheDocument();

    vi.useRealTimers();
  });
});
