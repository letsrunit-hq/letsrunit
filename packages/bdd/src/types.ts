import type { World as BaseWorld } from '@cucumber/cucumber';
import type { BrowserContextOptions, Page } from '@playwright/test';

export interface World extends BaseWorld<BrowserContextOptions> {
  page: Page;
  startTime: number;
  pathParams?: Record<string, string>;
  lang?: {
    code: string;
    name: string;
  };
  [_: string]: any;
}

export type StepHandler = (this: World, ...args: any[]) => Promise<void> | void;
export type StepType = 'Given' | 'When' | 'Then';

export interface StepDefinition {
  type: StepType;
  expression: string | RegExp;
  fn: StepHandler;
  comment?: string;
}
