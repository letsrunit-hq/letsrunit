import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { NavigationMenu } from './navigation-menu';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useParams: () => ({ projectId: '1' }),
}));

describe('NavigationMenu', () => {
  it('renders organizations and projects', () => {
    render(<NavigationMenu />);
    
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
