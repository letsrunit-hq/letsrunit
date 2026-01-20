import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { AnimatedWave } from './animated-wave';

describe('AnimatedWave', () => {
  it('renders svg elements', () => {
    const { container } = render(
      <svg>
        <AnimatedWave d="M0 0 L10 10" color="red" duration={1} />
      </svg>,
    );
    const g = container.querySelector('g');
    expect(g).toBeInTheDocument();
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(2);
    expect(paths[0]).toHaveAttribute('stroke', 'red');
  });
});
