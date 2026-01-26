import { loginWithOAuth } from '@/libs/auth';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { GithubLoginButton } from './github-login-button';

vi.mock('@/libs/auth', () => ({
  loginWithOAuth: vi.fn(),
}));

const mockShow = vi.fn();
vi.mock('@/context/toast-context', () => ({
  useToast: () => ({
    show: mockShow,
  }),
}));

vi.mock('@/hooks/use-supabase', () => ({
  useSupabase: (_opts: any, _setError: any) => ({}),
}));

describe('GithubLoginButton', () => {
  it('renders correctly', () => {
    render(<GithubLoginButton />);
    expect(screen.getByText('Continue with GitHub')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<GithubLoginButton className="custom-class" />);
    const button = container.querySelector('button');
    expect(button?.className).toContain('custom-class');
  });

  it('calls loginWithOAuth on click', async () => {
    vi.mocked(loginWithOAuth).mockResolvedValue(undefined);

    render(<GithubLoginButton />);
    fireEvent.click(screen.getByText('Continue with GitHub'));

    await waitFor(() => {
      expect(loginWithOAuth).toHaveBeenCalledWith(
        {
          provider: 'github',
          redirectTo: expect.stringContaining('/auth/callback'),
        },
        { supabase: expect.anything() },
      );
    });
  });

  it('shows toast error on failure', async () => {
    vi.mocked(loginWithOAuth).mockRejectedValue(new Error('OAuth failed'));

    render(<GithubLoginButton />);
    fireEvent.click(screen.getByText('Continue with GitHub'));

    await waitFor(() => {
      expect(mockShow).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'OAuth failed',
        }),
      );
    });
  });
});
