import useAuthStatus from '@/hooks/use-auth-status';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AuthButton } from './auth-button';

vi.mock('@/hooks/use-auth-status', () => ({
  default: vi.fn(),
}));

describe('AuthButton', () => {
  it('returns null when status is null', () => {
    vi.mocked(useAuthStatus).mockReturnValue(null);

    const { container } = render(<AuthButton className="test-class" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders Dashboard link when logged in', () => {
    vi.mocked(useAuthStatus).mockReturnValue(true);

    render(<AuthButton className="test-class" />);

    const link = screen.getByRole('link', { name: /dashboard/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/projects');
    expect(link).toHaveClass('test-class');
  });

  it('renders Login link when not logged in', () => {
    vi.mocked(useAuthStatus).mockReturnValue(false);

    render(<AuthButton className="test-class" />);

    const link = screen.getByRole('link', { name: /login/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/auth/login');
    expect(link).toHaveClass('test-class');
  });
});
