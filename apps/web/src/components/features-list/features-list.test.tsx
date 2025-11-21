import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeaturesList } from './features-list';

describe('FeaturesList', () => {
  it('renders', () => {
    render(<FeaturesList>Hello</FeaturesList>);
    expect(screen.getByText(/FeaturesList/)).toBeInTheDocument();
    expect(screen.getByText(/Hello/)).toBeInTheDocument();
  });
});