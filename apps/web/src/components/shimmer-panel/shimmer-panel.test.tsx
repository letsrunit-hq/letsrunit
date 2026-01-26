import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { ShimmerPanel } from './shimmer-panel';

describe('ShimmerPanel', () => {
  it('renders children', () => {
    render(<ShimmerPanel>Hello</ShimmerPanel>);
    expect(screen.getByText(/Hello/)).toBeInTheDocument();
  });
});
