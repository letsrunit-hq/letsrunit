import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { SubtleHeader } from './subtle-header';

describe('SubtleHeader', () => {
  it('renders children', () => {
    render(<SubtleHeader>Header Content</SubtleHeader>);
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });
});
