import type { Result as RunResult } from '@letsrunit/gherker';
import type { Snapshot } from '@letsrunit/playwright';
import type { BrowserContextOptions, Page } from '@playwright/test';

export type Result = Omit<RunResult, 'world'> & { page: Snapshot };

export interface World {
  page: Page;
  options?: BrowserContextOptions;
  lang?: string;
  [_: string]: any;
}
