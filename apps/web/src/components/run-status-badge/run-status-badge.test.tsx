import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { RunStatusBadge } from './run-status-badge';

describe('RunStatusBadge', () => {
  it('renders passed status', () => {
    render(<RunStatusBadge status="passed" />);
    expect(screen.getByText(/Passed/)).toBeInTheDocument();
  });

  it('renders failed status', () => {
    render(<RunStatusBadge status="failed" />);
    expect(screen.getByText(/Failed/)).toBeInTheDocument();
  });

  it('renders error status', () => {
    render(<RunStatusBadge status="error" />);
    expect(screen.getByText(/Error/)).toBeInTheDocument();
  });

  it('renders nothing for unknown status', () => {
    const { container } = render(<RunStatusBadge status={undefined} />);
    expect(container.firstChild).toBeNull();
  });
});
