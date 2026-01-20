import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAbortController } from '../use-abort-controller';

describe('useAbortController', () => {
  it('returns an AbortController', () => {
    const { result } = renderHook(() => useAbortController());
    expect(result.current).toBeInstanceOf(AbortController);
    expect(result.current.signal.aborted).toBe(false);
  });

  it('aborts on unmount', () => {
    const { result, unmount } = renderHook(() => useAbortController());
    const controller = result.current;
    unmount();
    expect(controller.signal.aborted).toBe(true);
  });
});
