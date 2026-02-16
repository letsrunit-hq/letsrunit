import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NavigationMenu } from './navigation-menu';

const mockUseNavState = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/use-nav-state', () => ({
  useNavState: mockUseNavState,
}));

const mockProps = {
  organizations: [{ account_id: '1', name: 'Acme Corp' }],
  projects: [{ id: 'proj-1', name: 'E-commerce Platform' }],
  user: { name: 'John Doe', email: 'john@example.com', isAnonymous: false },
  selected: {
    org: '1',
    project: 'proj-1',
    page: 'project',
  },
};

describe('NavigationMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when navState is hidden', () => {
    mockUseNavState.mockReturnValue(['hidden', vi.fn()]);

    const { container } = render(<NavigationMenu {...mockProps} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders expanded menu items correctly', () => {
    mockUseNavState.mockReturnValue(['expanded', vi.fn()]);

    render(<NavigationMenu {...mockProps} />);

    expect(screen.getByText('E-commerce Platform')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders collapsed menu correctly', () => {
    mockUseNavState.mockReturnValue(['collapsed', vi.fn()]);

    render(<NavigationMenu {...mockProps} />);

    const aside = screen.getByRole('complementary');
    expect(aside).toHaveClass('w-5rem');
    expect(aside).toHaveClass('collapsed');
  });

  it('handles toggle click', () => {
    const setNavState = vi.fn();
    mockUseNavState.mockReturnValue(['expanded', setNavState]);

    render(<NavigationMenu {...mockProps} />);

    const toggle = screen.getByTestId('collapse-toggle');
    fireEvent.click(toggle);

    expect(setNavState).toHaveBeenCalled();
  });

  it('handles transition end', () => {
    const setNavState = vi.fn();
    mockUseNavState.mockReturnValue(['collapsing', setNavState]);

    render(<NavigationMenu {...mockProps} />);

    const aside = screen.getByRole('complementary');
    fireEvent.transitionEnd(aside, { propertyName: 'width' });

    expect(setNavState).toHaveBeenCalledWith('collapsed');
  });
});
