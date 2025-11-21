import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsToolbar } from './stats-toolbar';

describe('StatsToolbar', () => {
  it('renders', () => {
    render(<StatsToolbar>Hello</StatsToolbar>);
    expect(screen.getByText(/StatsToolbar/)).toBeInTheDocument();
    expect(screen.getByText(/Hello/)).toBeInTheDocument();
  });
});