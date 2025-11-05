import { expect } from '@playwright/test';

export function expectOrNot<T>(actual: T, toBe: boolean) {
  return toBe ? expect(actual) : expect(actual).not;
}
