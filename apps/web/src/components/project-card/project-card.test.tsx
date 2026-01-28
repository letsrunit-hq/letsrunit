import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { Project, ProjectCard } from './project-card';

const mockProject: Project = {
  id: '1',
  name: 'Test Project',
  url: 'https://test.com',
  favicon: '🚀',
  description: 'A test description',
  testsCount: 10,
  suggestionsCount: 5,
  passRate: 95,
};

describe('ProjectCard', () => {
  it('renders project information', () => {
    const { container } = render(<ProjectCard project={mockProject} />);

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('https://test.com')).toBeInTheDocument();
    expect(screen.getByText('A test description')).toBeInTheDocument();
    expect(screen.getByText('10 tests')).toBeInTheDocument();
    expect(screen.getByText('5 suggestions')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    // In PrimeReact Chip, if it's passed as a string and no label is provided, it might be used as a class or icon.
    // Based on the DOM output, the emoji is used as a class in the icon span: <span class="p-chip-icon 🚀" ... />
    // We can verify its presence by checking if the icon span has the emoji class.
    const iconSpan = container.querySelector('.p-chip-icon');
    expect(iconSpan).toHaveClass('🚀');
  });

  it('renders with correct pass rate color for high rate', () => {
    render(<ProjectCard project={mockProject} />);
    const passRateElement = screen.getByText('95%');
    expect(passRateElement).toHaveClass('text-emerald-400');
  });

  it('renders with correct pass rate color for medium rate', () => {
    render(<ProjectCard project={{ ...mockProject, passRate: 75 }} />);
    const passRateElement = screen.getByText('75%');
    expect(passRateElement).toHaveClass('text-orange-400');
  });

  it('renders with correct pass rate color for low rate', () => {
    render(<ProjectCard project={{ ...mockProject, passRate: 50 }} />);
    const passRateElement = screen.getByText('50%');
    expect(passRateElement).toHaveClass('text-red-400');
  });
});
