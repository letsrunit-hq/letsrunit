import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tile } from './tile';

describe('Tile', () => {
  it('renders', () => {
    render(<Tile>Hello</Tile>);
    expect(screen.getByText(/Tile/)).toBeInTheDocument();
    expect(screen.getByText(/Hello/)).toBeInTheDocument();
  });
});