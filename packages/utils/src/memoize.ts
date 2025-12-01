import { LRUCache } from 'lru-cache';
import { hash } from './hash';

interface MemoOptions {
  ttl?: number;
  max?: number;
  cacheKey?: (args: any[]) => string;
}

export function memoize<F extends (...args: any[]) => any>(fn: F, opts: MemoOptions = {}): F {
  const {
    ttl,
    max = 1000,
    cacheKey = hash,
  } = opts;

  const cache = new LRUCache<string, any>({ ttl, max });

  const wrapped = (...args: Parameters<F>): ReturnType<F> => {
    const key = cacheKey(args);

    if (cache.has(key)) {
      return cache.get(key) as ReturnType<F>;
    }

    const result = fn(...args);
    cache.set(key, result);

    if (result instanceof Promise) {
      result.catch(() => cache.delete(key));
    }

    return result as ReturnType<F>;
  };

  return wrapped as F;
}
