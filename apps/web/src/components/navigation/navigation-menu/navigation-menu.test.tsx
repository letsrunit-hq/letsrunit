import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { NavigationMenu } from './navigation-menu';

const mockProps = {
  organizations: [{ account_id: '1', name: 'Acme Corp' }],
  projects: [{ id: '1', name: 'E-commerce Platform' }],
  user: { name: 'John Doe', email: 'john@example.com', isAnonymous: false },
  selected: {
    org: '1',
    project: '1',
    page: 'project',
  },
};

describe('NavigationMenu', () => {
  it('renders organizations and projects', () => {
    render(<NavigationMenu {...mockProps} />);

    // Check for organization name (can be multiple if dropdown is in DOM)
    expect(screen.getAllByText('Acme Corp')[0]).toBeInTheDocument();

    // Check for project name
    expect(screen.getAllByText('E-commerce Platform')[0]).toBeInTheDocument();

    // Check for navigation links
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Run History')).toBeInTheDocument();
    expect(screen.getByText('Project Settings')).toBeInTheDocument();
  });

  it('renders Personal as default when no organization is selected', () => {
    const propsWithoutOrg = {
      ...mockProps,
      selected: {
        ...mockProps.selected,
        org: undefined,
      },
    };
    render(<NavigationMenu {...propsWithoutOrg} />);

    expect(screen.getAllByText('Personal')[0]).toBeInTheDocument();
    // Organization Settings should not be visible
    expect(screen.queryByText('Organization Settings')).not.toBeInTheDocument();
  });

  it('renders without projects when no project is selected', () => {
    const propsWithoutProject = {
      ...mockProps,
      selected: {
        ...mockProps.selected,
        project: undefined,
      },
    };
    render(<NavigationMenu {...propsWithoutProject} />);

    // Check for organization name
    expect(screen.getAllByText('Acme Corp')[0]).toBeInTheDocument();

    // Project name should NOT be visible
    expect(screen.queryByText('E-commerce Platform')).not.toBeInTheDocument();

    // Project navigation links should NOT be visible
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Run History')).not.toBeInTheDocument();
    expect(screen.queryByText('Project Settings')).not.toBeInTheDocument();
  });

  it('does not show Organizations group when organizations list is empty', async () => {
    const propsWithoutOrgs = {
      ...mockProps,
      organizations: [],
      selected: {
        ...mockProps.selected,
        org: undefined,
      },
    };
    render(<NavigationMenu {...propsWithoutOrgs} />);

    expect(screen.queryByText('Organizations')).not.toBeInTheDocument();
  });

  it('handles collapse transition correctly', () => {
    const { container } = render(<NavigationMenu {...mockProps} />);
    const aside = container.querySelector('aside');
    const toggleButton = container.querySelector('.collapse-toggle');

    expect(aside).not.toHaveClass('collapsed');
    expect(screen.getByText('Dashboard')).toBeInTheDocument();

    // Click toggle to start collapsing
    fireEvent.click(toggleButton!);
    expect(aside).toHaveClass('collapsed');
    // During transition (collapsing), labels should still be visible because we use isExpandingOrExpanded
    // Note: We need to use queryByText and check if it exists because getByText fails if not found
    expect(screen.queryByText('Dashboard')).toBeInTheDocument();

    // Simulate transition end on a DIFFERENT property - should NOT trigger collapse
    fireEvent.transitionEnd(aside!, { propertyName: 'opacity' });
    expect(screen.queryByText('Dashboard')).toBeInTheDocument();

    // Simulate transition end on width
    fireEvent.transitionEnd(aside!, { propertyName: 'width' });

    // After transition, it should be fully collapsed and labels hidden
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();

    // Click toggle to expand
    fireEvent.click(toggleButton!);
    expect(aside).not.toHaveClass('collapsed');
    expect(screen.queryByText('Dashboard')).toBeInTheDocument();
  });
});
