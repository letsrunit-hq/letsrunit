import { useCallback, useRef, useState } from 'react';

export function useStateWithRef<T>(initial: T) {
  const [state, setState] = useState<T>(initial);
  const ref = useRef<T>(state);

  const set = useCallback((value: T | ((prev: T) => T)) => {
    setState(prev => {
      const next = typeof value === 'function'
        ? (value as (prev: T) => T)(prev)
        : value;

      ref.current = next;
      return next;
    });
  }, []);

  return [state, set, ref] as const;
}
