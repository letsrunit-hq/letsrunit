import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { NavigationMenu } from './navigation-menu';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useParams: () => ({ projectId: '1' }),
}));

const mockProps = {
  organizations: [{ account_id: '1', name: 'Acme Corp' }],
  projects: [{ id: '1', name: 'E-commerce Platform' }],
  selectedOrg: { account_id: '1', name: 'Acme Corp' },
  selectedProject: { id: '1', name: 'E-commerce Platform' },
  user: { name: 'John Doe', email: 'john@example.com' },
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
});
