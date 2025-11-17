import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueueStatus } from './queue-status';

describe('QueueStatus', () => {
  it('renders', () => {
    render(<QueueStatus />);
    expect(screen.getByText(/Request Queued/)).toBeInTheDocument();
  });
});
