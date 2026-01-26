import { signup } from '@/libs/auth';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SignupForm } from './signup-form';

vi.mock('@/libs/auth', () => ({
  signup: vi.fn(),
}));

vi.mock('@/hooks/use-supabase', () => ({
  useSupabase: (_opts: any, _setError: any) => ({}),
}));

describe('SignupForm', () => {
  it('renders signup fields', () => {
    render(<SignupForm />);
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create account/i })).toBeInTheDocument();
  });

  it('enables shimmer only when form is filled', () => {
    render(<SignupForm />);

    // Initially empty, no shimmer
    expect(screen.queryByTestId('shimmer-effect')).not.toBeInTheDocument();

    // Fill name
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
    expect(screen.queryByTestId('shimmer-effect')).not.toBeInTheDocument();

    // Fill email
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } });
    expect(screen.queryByTestId('shimmer-effect')).not.toBeInTheDocument();

    // Fill password (too short)
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: '1234567' } });
    expect(screen.queryByTestId('shimmer-effect')).not.toBeInTheDocument();

    // Fill password (long enough)
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: '12345678' } });
    expect(screen.getByTestId('shimmer-effect')).toBeInTheDocument();

    // Clear name
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: '' } });
    expect(screen.queryByTestId('shimmer-effect')).not.toBeInTheDocument();
  });

  it('calls signup on submit', async () => {
    vi.mocked(signup).mockResolvedValue(undefined);

    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /Create account/i }));

    await waitFor(() => {
      expect(signup).toHaveBeenCalledWith(
        { email: 'john@example.com', password: 'password123', name: 'John Doe' },
        { supabase: expect.anything() },
      );
    });
  });

  it('displays error message on failure', async () => {
    vi.mocked(signup).mockRejectedValue(new Error('Signup failed'));

    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /Create account/i }));

    expect(await screen.findByText('Signup failed')).toBeInTheDocument();
  });
});
