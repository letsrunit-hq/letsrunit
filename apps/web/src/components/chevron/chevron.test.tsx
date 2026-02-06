import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { Chevron } from './chevron';

describe('Chevron', () => {
  it('renders vertical open (ChevronUp)', () => {
    render(<Chevron open={true} direction="vertical" />);
    expect(screen.getByTestId('chevron-open')).toHaveClass('lucide-chevron-up');
  });

  it('renders vertical closed (ChevronDown)', () => {
    render(<Chevron open={false} direction="vertical" />);
    expect(screen.getByTestId('chevron-closed')).toHaveClass('lucide-chevron-down');
  });

  it('renders horizontal open (ChevronLeft)', () => {
    render(<Chevron open={true} direction="horizontal" />);
    expect(screen.getByTestId('chevron-open')).toHaveClass('lucide-chevron-left');
  });

  it('renders horizontal closed (ChevronRight)', () => {
    render(<Chevron open={false} direction="horizontal" />);
    expect(screen.getByTestId('chevron-closed')).toHaveClass('lucide-chevron-right');
  });

  it('handles flipped prop correctly for vertical', () => {
    // open=true, flipped=true => ab = false => ChevronDown
    render(<Chevron open={true} flipped={true} direction="vertical" />);
    expect(screen.getByTestId('chevron-open')).toHaveClass('lucide-chevron-down');

    // open=false, flipped=true => ab = true => ChevronUp
    render(<Chevron open={false} flipped={true} direction="vertical" />);
    expect(screen.getByTestId('chevron-closed')).toHaveClass('lucide-chevron-up');
  });

  it('passes extra props to lucide icon', () => {
    render(<Chevron open={true} size={48} className="custom-class" />);
    const svg = screen.getByTestId('chevron-open');
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveClass('custom-class');
  });
});
