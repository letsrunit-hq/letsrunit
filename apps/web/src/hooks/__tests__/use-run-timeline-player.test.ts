import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useTimelinePlayer } from '../use-timeline-player';

describe('useRunTimelinePlayer', () => {
  it('toggles play/pause', () => {
    const { result } = renderHook(() =>
      useTimelinePlayer({
        enabled: true,
        total: 3,
        selectedIndex: 0,
        selectIndex: () => {},
        delayMs: 5,
      }),
    );
    expect(result.current.playing).toBe(false);
    act(() => result.current.toggle());
    expect(result.current.playing).toBe(true);
    act(() => result.current.pause());
    expect(result.current.playing).toBe(false);
  });
});
