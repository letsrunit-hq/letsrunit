import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnimatedWave } from './animated-wave';

describe('AnimatedWave', () => {
  it('renders', () => {
    render(<AnimatedWave>Hello</AnimatedWave>);
    expect(screen.getByText(/AnimatedWave/)).toBeInTheDocument();
    expect(screen.getByText(/Hello/)).toBeInTheDocument();
  });
});