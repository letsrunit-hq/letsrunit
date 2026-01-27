import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { Tile } from './tile';

describe('Tile', () => {
  it('renders label', () => {
    render(<Tile label="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders with tile class', () => {
    const { container } = render(<Tile />);
    expect(container.firstChild).toHaveClass('tile');
  });
});
