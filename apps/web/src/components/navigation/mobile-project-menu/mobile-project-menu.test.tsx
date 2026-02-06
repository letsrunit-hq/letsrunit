import { fireEvent, render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MobileProjectMenu } from './mobile-project-menu';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

const mockOrganizations = [{ account_id: 'org1', name: 'Org 1' }];
const mockProjects = [{ id: 'proj1', name: 'Project 1', favicon: 'fav.png' }];

describe('MobileProjectMenu', () => {
  it('renders organization and project items', () => {
    render(<MobileProjectMenu organizations={mockOrganizations} projects={mockProjects} />);

    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('Org 1')).toBeInTheDocument();
    expect(screen.getByText('Project 1')).toBeInTheDocument();
  });

  it('calls onItemClick and navigates when an item is clicked', () => {
    const push = vi.fn();
    (useRouter as any).mockReturnValue({ push });
    const onItemClick = vi.fn();

    render(
      <MobileProjectMenu
        organizations={mockOrganizations}
        projects={mockProjects}
        onItemClick={onItemClick}
      />,
    );

    const personalItem = screen.getByText('Personal').closest('a');
    fireEvent.click(personalItem!);

    expect(onItemClick).toHaveBeenCalled();
  });
});
