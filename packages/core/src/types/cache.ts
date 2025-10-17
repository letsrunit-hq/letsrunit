import { MaybePromise } from './util';

export type Cache<T = any> = {
  get: (key: string) => MaybePromise<T | undefined>,
  set: (key: string, value: T) => any,
  has: (key: string) => MaybePromise<boolean>,
}
