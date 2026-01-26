import { login } from '@/libs/auth';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { LoginForm } from './login-form';

vi.mock('@/libs/auth', () => ({
  login: vi.fn(),
}));

vi.mock('@/hooks/use-supabase', () => ({
  useSupabase: (_opts: any, _setError: any) => ({}),
}));

describe('LoginForm', () => {
  it('renders login fields', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
  });

  it('enables shimmer only when form is filled', () => {
    render(<LoginForm />);

    // Initially empty, no shimmer
    expect(screen.queryByTestId('shimmer-effect')).not.toBeInTheDocument();

    // Fill email
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } });
    expect(screen.queryByTestId('shimmer-effect')).not.toBeInTheDocument();

    // Fill password
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    expect(screen.getByTestId('shimmer-effect')).toBeInTheDocument();

    // Clear email
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: '' } });
    expect(screen.queryByTestId('shimmer-effect')).not.toBeInTheDocument();
  });

  it('calls login on submit', async () => {
    vi.mocked(login).mockResolvedValue(undefined);

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith(
        { email: 'test@example.com', password: 'password123' },
        { supabase: expect.anything() }
      );
    });
  });

  it('displays error message on failure', async () => {
    vi.mocked(login).mockRejectedValue(new Error('Invalid login'));

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));

    expect(await screen.findByText('Invalid login')).toBeInTheDocument();
  });
});
