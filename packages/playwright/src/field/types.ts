import type { Locator } from '@playwright/test';

export interface SetOptions {
  force?: boolean;
  noWaitAfter?: boolean;
  timeout?: number;
}

export type Value = string | number | Date | boolean;

export interface Loc {
  el: Locator;
  tag: string;
  type: string | null;
}
