import { useSupabase } from '@/hooks/use-supabase';
import { isLoggedIn } from '@/libs/auth';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAuthStatus } from '../use-auth-status';

vi.mock('@/libs/auth', () => ({
  isLoggedIn: vi.fn(),
}));

vi.mock('@/hooks/use-supabase', () => ({
  useSupabase: vi.fn(),
}));

describe('useAuthStatus', () => {
  const mockOnAuthStateChange = vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  }));

  const mockSupabase = {
    auth: {
      onAuthStateChange: mockOnAuthStateChange,
    },
  };

  it('returns null initially and then the auth status', async () => {
    vi.mocked(useSupabase).mockReturnValue(mockSupabase as any);
    vi.mocked(isLoggedIn).mockResolvedValue(true);

    const { result } = renderHook(() => useAuthStatus());

    expect(result.current).toBe(null);

    await waitFor(() => expect(result.current).toBe(true));
  });

  it('updates when auth state changes', async () => {
    vi.mocked(useSupabase).mockReturnValue(mockSupabase as any);
    vi.mocked(isLoggedIn).mockResolvedValueOnce(false).mockResolvedValue(true);

    const { result } = renderHook(() => useAuthStatus());

    await waitFor(() => expect(result.current).toBe(false));

    // Simulate auth state change
    const callback = mockOnAuthStateChange.mock.calls[0][0];

    act(() => {
      callback('SIGNED_IN', null);
    });

    await waitFor(() => expect(result.current).toBe(true));
  });

  it('returns false on error', async () => {
    vi.mocked(useSupabase).mockReturnValue(mockSupabase as any);
    vi.mocked(isLoggedIn).mockRejectedValue(new Error('Auth error'));

    const { result } = renderHook(() => useAuthStatus());

    await waitFor(() => expect(result.current).toBe(false));
  });
});
