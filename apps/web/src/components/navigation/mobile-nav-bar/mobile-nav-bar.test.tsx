import { fireEvent, render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MobileNavBar } from './mobile-nav-bar';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

const mockProps = {
  selectedProject: { id: 'proj1', name: 'E-commerce Platform', favicon: 'favicon.png' },
  selectedOrgName: 'Acme Corp',
  onMenuClick: vi.fn(),
};

describe('MobileNavBar', () => {
  it('renders project name and favicon when project is provided', () => {
    render(<MobileNavBar {...mockProps} />);
    expect(screen.getByText('E-commerce Platform')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'favicon.png');
  });

  it('renders organization name when no project is provided', () => {
    const props = { ...mockProps, selectedProject: undefined };
    render(<MobileNavBar {...props} />);
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('renders Personal when no project or org name is provided', () => {
    const props = { ...mockProps, selectedProject: undefined, selectedOrgName: undefined };
    render(<MobileNavBar {...props} />);
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  it('calls onMenuClick when user button is clicked', () => {
    const onMenuClick = vi.fn();
    render(<MobileNavBar {...mockProps} onMenuClick={onMenuClick} isAnonymous={false} />);
    const buttons = screen.getAllByRole('button');
    const userButton = buttons[buttons.length - 1];

    fireEvent.click(userButton);
    expect(onMenuClick).toHaveBeenCalled();
  });

  it('navigates to signup when userplus button is clicked for anonymous user', () => {
    const push = vi.fn();
    (useRouter as any).mockReturnValue({ push });
    render(<MobileNavBar {...mockProps} isAnonymous={true} />);
    const buttons = screen.getAllByRole('button');
    const signupButton = buttons[buttons.length - 1];

    fireEvent.click(signupButton);
    expect(push).toHaveBeenCalledWith('/auth/signup');
  });

  it('calls onProjectClick when center content is clicked', () => {
    const onProjectClick = vi.fn();
    render(<MobileNavBar {...mockProps} onProjectClick={onProjectClick} />);
    const centerContent = screen.getByText('E-commerce Platform').parentElement!;
    fireEvent.click(centerContent);
    expect(onProjectClick).toHaveBeenCalled();
  });

  it('navigates to projects on back click', () => {
    const push = vi.fn();
    (useRouter as any).mockReturnValue({ push });

    render(<MobileNavBar {...mockProps} />);
    const buttons = screen.getAllByRole('button');
    const backButton = buttons[0];

    fireEvent.click(backButton);
    expect(push).toHaveBeenCalledWith('/projects');
  });

  it('hides back button when no project and no org name', () => {
    const props = { ...mockProps, selectedProject: undefined, selectedOrgName: undefined };
    render(<MobileNavBar {...props} />);
    const buttons = screen.getAllByRole('button');
    // Only menu button should be present
    expect(buttons).toHaveLength(1);
  });
});
