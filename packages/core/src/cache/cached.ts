import type { Cache, MaybePromise } from '#types';

export async function cached<T>(cache: Cache<T>, key: string, callback: () => MaybePromise<T>): Promise<T> {
  const fromCache = await cache.get(key);
  if (fromCache !== undefined) {
    return fromCache;
  }

  const value = await callback();
  await cache.set(key, value);

  return value;
}
