import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InverseIcon } from './inverse-icon';

describe('InverseIcon', () => {
  it('renders', () => {
    render(<InverseIcon>Hello</InverseIcon>);
    expect(screen.getByText(/InverseIcon/)).toBeInTheDocument();
    expect(screen.getByText(/Hello/)).toBeInTheDocument();
  });
});