import { Runner, StepHandler } from '@letsrunit/gherker';
import { type BrowserContextOptions, Page } from '@playwright/test';
import { ParameterType } from '@cucumber/cucumber-expressions'

export interface World {
  page: Page;
  options?: BrowserContextOptions;
  lang?: string;
  [_: string]: any;
}

export const runner = new Runner<World>();

export function Given(expression: string | RegExp, fn: StepHandler<World>, comment?: string): void {
  runner.defineStep('Given', expression, fn, comment);
}
export function When(expression: string | RegExp, fn: StepHandler<World>, comment?: string): void {
  runner.defineStep('When', expression, fn, comment);
}
export function Then(expression: string | RegExp, fn: StepHandler<World>, comment?: string): void {
  runner.defineStep('Then', expression, fn, comment);
}

export function defineParameterType(param: ParameterType<unknown>): void {
  runner.registry.defineParameterType(param);
}
