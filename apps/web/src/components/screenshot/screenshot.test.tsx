import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Screenshot } from './screenshot';

describe('Screenshot', () => {
  it('renders', () => {
    render(<Screenshot>Hello</Screenshot>);
    expect(screen.getByText(/Screenshot/)).toBeInTheDocument();
    expect(screen.getByText(/Hello/)).toBeInTheDocument();
  });
});