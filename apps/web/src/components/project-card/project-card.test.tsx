import type { Project } from '@letsrunit/model';
import { fixedUUID } from '@letsrunit/utils';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { ProjectCard } from './project-card';

const mockProject = {
  id: fixedUUID(1),
  name: 'Test Project',
  url: 'https://test.com',
  favicon: '🚀',
  description: 'A test description',
  testsCount: 10,
  suggestionsCount: 5,
  passRate: 95,
} as Project;

describe('ProjectCard', () => {
  it('renders project information', () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('https://test.com')).toBeInTheDocument();
    expect(screen.getByText('A test description')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('renders with correct pass rate color for high rate', () => {
    render(<ProjectCard project={mockProject} />);
    const passRateElement = screen.getByText('95%').parentElement;
    expect(passRateElement).toHaveClass('text-green-400');
  });

  it('renders with correct pass rate color for medium rate', () => {
    render(<ProjectCard project={{ ...mockProject, passRate: 75 }} />);
    const passRateElement = screen.getByText('75%').parentElement;
    expect(passRateElement).toHaveClass('text-orange-400');
  });

  it('renders with correct pass rate color for low rate', () => {
    render(<ProjectCard project={{ ...mockProject, passRate: 50 }} />);
    const passRateElement = screen.getByText('50%').parentElement;
    expect(passRateElement).toHaveClass('text-red-400');
  });
});
