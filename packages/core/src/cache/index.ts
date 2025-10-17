import type { Cache, MaybeAsync } from '../types';

export const dummyCache: Cache<any> = {
  has: () => false,
  get: (_key: string) => undefined,
  set: (_key: string, _input: any) => {},
}

export async function cached<T>(cache: Cache<T>, key: string, callback: MaybeAsync<() => Promise<T>>): Promise<T> {
  const fromCache = await cache.get(key);
  if (fromCache !== undefined) {
    return fromCache;
  }

  const value = await callback();
  await cache.set(key, value);

  return value;
}

