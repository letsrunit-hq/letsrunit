import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsToolbar } from './stats-toolbar';

describe('StatsToolbar', () => {
  it('renders stats values', () => {
    render(
      <StatsToolbar totalFeatures={10} activeTests={4} suggestions={6} passRate={75} />,
    );
    expect(screen.getByText('Total Features')).toBeInTheDocument();
    expect(screen.getByText('Test cases')).toBeInTheDocument();
    expect(screen.getByText('Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Pass Rate')).toBeInTheDocument();

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });
});
