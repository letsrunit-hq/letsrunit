import type { BrowserContextOptions, Page } from '@playwright/test';

export interface World {
  page: Page;
  startTime: number;
  options?: BrowserContextOptions;
  lang?: string;
  [_: string]: any;
}

export type StepHandler = (world: World, ...args: any[]) => Promise<void> | void;
export type StepType = 'Given' | 'When' | 'Then';

export interface StepDefinition {
  type: StepType;
  expression: string | RegExp;
  fn: StepHandler;
  comment?: string;
}
