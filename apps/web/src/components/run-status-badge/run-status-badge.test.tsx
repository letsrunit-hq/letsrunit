import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RunStatusBadge } from './run-status-badge';

describe('RunStatusBadge', () => {
  it('renders', () => {
    render(<RunStatusBadge>Hello</RunStatusBadge>);
    expect(screen.getByText(/RunStatusBadge/)).toBeInTheDocument();
    expect(screen.getByText(/Hello/)).toBeInTheDocument();
  });
});