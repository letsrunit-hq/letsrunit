import type { Cartesian } from './types';

export function cartesian<const T extends readonly (readonly unknown[])[]>(...arrays: T): Cartesian<T> {
  let acc: unknown[][] = [[]];

  for (const arr of arrays) {
    acc = acc.flatMap((prev) => arr.map((v) => [...prev, v]));
  }

  return acc as Cartesian<T>;
}
