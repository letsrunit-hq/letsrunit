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
  const { enabled, total, selectedIndex, selectIndex } = options;
  const delayMs = options.delayMs ?? 1000;
  const wrapOnStart = options.wrapOnStart ?? true;
  const shouldFilter = Boolean(typeof options.hasScreenshotAt === 'function');

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
    if (!enabled || total === 0) {
      setPlaying(false);
      return;
    }

    // Determine the initial index to start from, with optional wrap-on-start
    let current = selectedIndex ?? 0;
    if (wrapOnStart && selectedIndex != null && total > 0 && selectedIndex >= total - 1) {
      current = 0;
    }

    // Helper to find the next playable index >= from (exclusive when nextOnly=true)
    const findNextPlayable = (from: number, nextOnly: boolean): number | null => {
      const start = nextOnly ? from + 1 : from;
      for (let i = start; i < total; i += 1) {
        if (!shouldFilter) return i;
        if (options.hasScreenshotAt!(i)) return i;
      }
      return null;
    };

    // Adjust initial current to first playable starting at current
    const initialPlayable = findNextPlayable(current, false);
    if (initialPlayable == null) {
      // Nothing to play; stop immediately
      setPlaying(false);
      return;
    }
    current = initialPlayable;

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
  }, [playing, enabled, total, selectedIndex, selectIndex, delayMs, wrapOnStart, shouldFilter, options.hasScreenshotAt]);

  return { playing, ...controls };
}

export default useTimelinePlayer;
