import { expect, type Expect } from '@playwright/test';

export function expectOrNot<T>(
  actual: T,
  toBe: boolean
): ReturnType<Expect<T>> | ReturnType<ReturnType<Expect<T>>['not']> {
  return toBe ? expect(actual) : expect(actual).not;
}
