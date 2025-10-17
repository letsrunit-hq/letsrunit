import type { Cache } from '#types';

export const dummyCache: Cache<any> = {
  has: () => false,
  get: (_key: string) => undefined,
  set: (_key: string, _input: any) => {},
}
