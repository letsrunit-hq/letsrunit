import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { ShimmerButton } from './shimmer-button';

describe('ShimmerButton', () => {
  it('renders with label', () => {
    render(<ShimmerButton label="Click me" />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <ShimmerButton>
        <span>Child content</span>
      </ShimmerButton>,
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });
});
