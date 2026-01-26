import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { RunHeader } from './run-header';

const mockRun = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  type: 'test',
  projectId: '123e4567-e89b-12d3-a456-426614174001',
  featureId: '123e4567-e89b-12d3-a456-426614174002',
  target: 'https://example.com',
  status: 'passed',
  error: null,
  startedAt: new Date('2024-01-01T12:00:00Z'),
  finishedAt: new Date('2024-01-01T12:00:05Z'),
  createdAt: new Date('2024-01-01T11:59:00Z'),
  createdBy: null,
  updatedAt: new Date('2024-01-01T12:00:05Z'),
  updatedBy: null,
} as any;

describe('RunHeader', () => {
  it('renders run target when no feature or name is provided', () => {
    render(<RunHeader run={mockRun} />);
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
  });

  it('renders feature name if provided', () => {
    const feature = {
      name: 'Test Feature',
      description: 'Test Description',
    } as any;
    render(<RunHeader run={mockRun} feature={feature} />);
    expect(screen.getByText('Test Feature')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('renders journal name if provided (overrides feature name)', () => {
    const feature = {
      name: 'Test Feature',
    } as any;
    const journal = {
      entries: [{ type: 'name', message: 'Journal Title' }],
    } as any;
    render(<RunHeader run={mockRun} feature={feature} journal={journal} />);
    expect(screen.getByText('Journal Title')).toBeInTheDocument();
    expect(screen.queryByText('Test Feature')).not.toBeInTheDocument();
  });

  it('renders run status and duration', () => {
    render(<RunHeader run={mockRun} />);
    expect(screen.getByText('passed')).toBeInTheDocument();
    expect(screen.getByText('5.0s')).toBeInTheDocument();
  });

  it('renders startedAt date', () => {
    render(<RunHeader run={mockRun} />);
    // The component uses en-UK locale explicitly.
    // We match only the date part to avoid timezone issues with time.
    expect(screen.getByText(/1 Jan 2024/)).toBeInTheDocument();
  });
});
