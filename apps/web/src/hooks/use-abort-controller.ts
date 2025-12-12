import { useEffect, useRef } from 'react';

export function useAbortController(): AbortController {
  const ref = useRef<AbortController | null>(null);

  if (!ref.current) {
    ref.current = new AbortController();
  }

  useEffect(() => {
    return () => {
      ref.current?.abort();
    };
  }, []);

  return ref.current;
}
