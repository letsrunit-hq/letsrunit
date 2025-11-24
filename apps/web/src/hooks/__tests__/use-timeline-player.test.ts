import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useTimelinePlayer } from '../use-timeline-player';

describe('useTimelinePlayer', () => {
  it('skips indices without screenshots when option enabled', () => {
    vi.useFakeTimers();
    const calls: number[] = [];
    const selectIndex = (i: number) => {
      calls.push(i);
    };

    const { result } = renderHook(() =>
      useTimelinePlayer({
        enabled: true,
        total: 5,
        selectedIndex: 0,
        selectIndex,
        delayMs: 10,
        hasScreenshotAt: (i) => i === 1 || i === 3,
      }),
    );

    // start playing
    act(() => result.current.play());

    // run immediate tick and first delay step
    act(() => {
      vi.advanceTimersByTime(0); // immediate kickoff
    });
    // should select first playable >= 0 which is 1
    expect(calls).toEqual([1]);

    act(() => {
      vi.advanceTimersByTime(10);
    });
    // next playable should be 3
    expect(calls).toEqual([1, 3]);

    // Advance again, there is no next playable (end), so it should stop
    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(result.current.playing).toBe(false);

    vi.useRealTimers();
  });
});
