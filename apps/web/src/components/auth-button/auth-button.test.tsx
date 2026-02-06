import { isLoggedIn } from '@/libs/auth';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthButton } from './auth-button';

vi.mock('@/libs/supabase/server', () => ({
  connect: vi.fn(),
}));

vi.mock('@/libs/auth', () => ({
  isLoggedIn: vi.fn(),
}));

describe('AuthButton', () => {
  it('renders Dashboard link when logged in', async () => {
    vi.mocked(isLoggedIn).mockResolvedValue(true);

    const Result = await AuthButton({ className: 'test-class' });
    render(Result);

    const link = screen.getByRole('link', { name: /dashboard/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/projects');
    expect(link).toHaveClass('test-class');
  });

  it('renders Login link when not logged in', async () => {
    vi.mocked(isLoggedIn).mockResolvedValue(false);

    const Result = await AuthButton({ className: 'test-class' });
    render(Result);

    const link = screen.getByRole('link', { name: /login/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');
    expect(link).toHaveClass('test-class');
  });
});
