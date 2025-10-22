import { Runner, StepHandler } from '@letsrunit/gherker';
import { Page } from '@playwright/test';
import { ParameterType } from '@cucumber/cucumber-expressions'

export interface World {
  page: Page;
  lang?: string;
  [_: string]: any;
}

export const runner = new Runner<World>();

export const Given = (expression: string | RegExp, fn: StepHandler<World>): void => runner.defineStep('Given', expression, fn);
export const When = (expression: string | RegExp, fn: StepHandler<World>): void => runner.defineStep('Given', expression, fn);
export const Then = (expression: string | RegExp, fn: StepHandler<World>): void => runner.defineStep('Given', expression, fn);

export function defineParameterType(param: ParameterType<unknown>): void {
  runner.registry.defineParameterType(param);
}
