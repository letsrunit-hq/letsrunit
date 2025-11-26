import { useEffect, useMemo, useState } from 'react';

export interface UseTimelinePlayerOptions {
  enabled: boolean;
  total: number;
  selectedIndex: number | null;
  selectIndex: (i: number) => void;
  delayMs?: number;
  wrapOnStart?: boolean;
  hasScreenshotAt?: (i: number) => boolean;
}

export interface UseTimelinePlayer {
  playing: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  setPlaying: (v: boolean) => void;
}

export function useTimelinePlayer(options: UseTimelinePlayerOptions): UseTimelinePlayer {
  const { enabled, total, selectedIndex, selectIndex, hasScreenshotAt } = options;
  const delayMs = options.delayMs ?? 1000;
  const wrapOnStart = options.wrapOnStart ?? true;

  const [playing, setPlaying] = useState(false);

  const controls = useMemo(
    () => ({
      play: () => setPlaying(true),
      pause: () => setPlaying(false),
      toggle: () => setPlaying((p) => !p),
      setPlaying,
    }),
    [],
  );

  useEffect(() => {
    if (!playing) return;
    if (!enabled || total <= 1) {
      setPlaying(false);
      return;
    }

    // Helper to find the next playable index >= from (exclusive when nextOnly=true)
    const findNextPlayable = (from: number, nextOnly: boolean): number | null => {
      const start = nextOnly ? from + 1 : from;
      for (let i = start; i < total; i += 1) {
        if (!hasScreenshotAt || hasScreenshotAt(i)) return i;
      }
      return null;
    };

    let current: number = -1;

    // Set the first playable step at current
    const initialPlayable = findNextPlayable(selectedIndex ?? 0, false);
    if (initialPlayable !== null) {
      current = initialPlayable;
    } else if (wrapOnStart) {
      current = selectedIndex ?? 0; // Will wrap
    }

    // Wrap if on the last step
    if (wrapOnStart && findNextPlayable(current, true) === null) {
      current = findNextPlayable(0, false) ?? -1;
    }

    // No playable steps
    if (current < 0) {
      setPlaying(false);
      return;
    }

    let cancelled = false;
    const cleanupFns: Array<() => void> = [];

    const tick = () => {
      if (cancelled) return;
      selectIndex(current);
      // Find next playable; if none, stop
      const next = findNextPlayable(current, true);
      if (next == null) {
        setPlaying(false);
        return;
      }
      const t = setTimeout(() => {
        current = next;
        tick();
      }, delayMs);
      cleanupFns.push(() => clearTimeout(t));
    };

    const initialTimer = setTimeout(() => {
      tick();
    }, 0);
    cleanupFns.push(() => clearTimeout(initialTimer));

    return () => {
      cancelled = true;
      cleanupFns.forEach((fn) => fn());
    };
  }, [playing, enabled, total, selectedIndex, selectIndex, delayMs, wrapOnStart, hasScreenshotAt]);

  return { playing, ...controls };
}

export default useTimelinePlayer;
