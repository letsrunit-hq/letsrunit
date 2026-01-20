import { connect } from '@/libs/supabase/browser';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSupabase } from '../use-supabase';

vi.mock('@/libs/supabase/browser', () => ({
  connect: vi.fn(),
}));

describe('useSupabase', () => {
  it('returns provided client', () => {
    const mockClient = { name: 'mock' } as any;
    const { result } = renderHook(() => useSupabase({ client: mockClient }));
    expect(result.current).toBe(mockClient);
  });

  it('calls connect when no client provided', () => {
    const mockClient = { name: 'connected' } as any;
    vi.mocked(connect).mockReturnValue(mockClient);

    const { result } = renderHook(() => useSupabase());
    expect(connect).toHaveBeenCalled();
    expect(result.current).toBe(mockClient);
  });

  it('handles connection error', () => {
    const setError = vi.fn();
    vi.mocked(connect).mockImplementation(() => {
      throw new Error('Connection failed');
    });

    const { result } = renderHook(() => useSupabase({}, setError));
    expect(result.current).toBeNull();
    expect(setError).toHaveBeenCalledWith('Connection failed');
  });
});
