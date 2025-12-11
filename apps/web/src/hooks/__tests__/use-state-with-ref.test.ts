import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStateWithRef } from '../use-state-with-ref';

describe('useStateWithRef', () => {
  it('toggles', () => {
    const { result } = renderHook(() => useStateWithRef());
    act(() => result.current.toggle());
    expect(result.current.value).toBe(true);
  });
});