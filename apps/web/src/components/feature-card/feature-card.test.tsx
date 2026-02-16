import { render, screen } from '@testing-library/react';
import { Package } from 'lucide-react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { FeatureCard } from './feature-card';

describe('FeatureCard', () => {
  it('renders title and icon', () => {
    render(
      <FeatureCard title="Standard tooling" icon={Package}>
        Cucumber.js executes the scenarios.
      </FeatureCard>,
    );
    expect(screen.getByText('Standard tooling')).toBeInTheDocument();
    expect(screen.getByText(/Cucumber.js executes the scenarios/)).toBeInTheDocument();
  });
});
