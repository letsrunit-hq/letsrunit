import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useWindowSize } from '../use-window-size';

describe('useWindowSize', () => {
  it('returns current window size', () => {
    vi.stubGlobal('innerWidth', 1024);
    vi.stubGlobal('innerHeight', 768);

    const { result } = renderHook(() => useWindowSize());

    expect(result.current).toEqual({ width: 1024, height: 768 });
  });

  it('updates size on resize', () => {
    vi.stubGlobal('innerWidth', 1024);
    vi.stubGlobal('innerHeight', 768);

    const { result } = renderHook(() => useWindowSize());

    act(() => {
      vi.stubGlobal('innerWidth', 1440);
      vi.stubGlobal('innerHeight', 900);
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toEqual({ width: 1440, height: 900 });
  });
});
