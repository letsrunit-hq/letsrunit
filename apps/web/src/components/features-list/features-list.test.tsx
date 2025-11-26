import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeaturesList } from './features-list';
import type { Feature } from '@letsrunit/model';
import { fixedUUID } from '@letsrunit/utils';

function makeFeature(partial: Pick<Feature, 'id' | 'name' | 'body'>): Feature {
  const now = new Date();
  return {
    ...partial,
    projectId: fixedUUID(1, 'project'),
    description: 'Foo bar',
    comments: null,
    enabled: true,
    lastRun: null,
    createdAt: now,
    createdBy: null,
    updatedAt: now,
    updatedBy: null,
  };
}

describe('FeaturesList', () => {
  it('renders feature items and create button', () => {
    const features: Feature[] = [
      makeFeature({ id: fixedUUID(1), name: 'Feature A', body: null }),
      makeFeature({ id: fixedUUID(2), name: 'Feature B', body: 'Feature: Test\n' }),
    ];
    render(<FeaturesList features={features} />);

    // Create button
    expect(screen.getByText('Create a new test')).toBeInTheDocument();

    // Items by name
    expect(screen.getByText('Feature A')).toBeInTheDocument();
    expect(screen.getByText('Feature B')).toBeInTheDocument();
  });
});
