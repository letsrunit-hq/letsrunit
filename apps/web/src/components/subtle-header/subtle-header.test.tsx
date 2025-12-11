import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubtleHeader } from './subtle-header';

describe('SubtleHeader', () => {
  it('renders', () => {
    render(<SubtleHeader>Hello</SubtleHeader>);
    expect(screen.getByText(/SubtleHeader/)).toBeInTheDocument();
    expect(screen.getByText(/Hello/)).toBeInTheDocument();
  });
});