import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSupabase } from '../use-supabase';

describe('useSupabase', () => {
  it('toggles', () => {
    const { result } = renderHook(() => useSupabase());
    act(() => result.current.toggle());
    expect(result.current.value).toBe(true);
  });
});