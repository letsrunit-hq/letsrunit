import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAbortController } from '../use-abort-controller';

describe('useAbortController', () => {
  it('toggles', () => {
    const { result } = renderHook(() => useAbortController());
    act(() => result.current.toggle());
    expect(result.current.value).toBe(true);
  });
});