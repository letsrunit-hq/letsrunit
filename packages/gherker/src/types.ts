import type { Argument, Expression } from '@cucumber/cucumber-expressions';
import type { ParameterTypeDefinition } from '@letsrunit/gherkin';

export type World = { cleanup?: () => void | Promise<void>; [_: string]: any };
export type StepHandler<T> = (this: T, ...args: any[]) => Promise<void> | void;
export type StepType = 'Given' | 'When' | 'Then';

export interface StepEntry<TWorld extends World = any> {
  type: StepType;
  source: string;
  fn: StepHandler<TWorld>;
  comment?: string;
}

export interface MatchResult<TWorld extends World = any> {
  def: StepEntry<TWorld>;
  values: unknown[];
  args: readonly Argument[];
}

export interface IStepRegistry<TWorld extends World = any> {
  defineStep(type: StepType, expression: string | RegExp, fn: StepHandler<TWorld>, comment?: string): void;
  defineParameterType(type: ParameterTypeDefinition<unknown>): void;
  match(text: string): MatchResult<TWorld> | null;
  readonly defs: ReadonlyArray<StepEntry<TWorld>>;
}

/** Internal compiled step — extends StepEntry with the compiled expression. */
export interface StepDefinition<TWorld extends World = any> extends StepEntry<TWorld> {
  expr: Expression;
}

export interface ParsedStep {
  text: string;
  def?: string;
  values?: unknown[];
}

export interface Result<TWorld extends World = any> {
  world: TWorld;
  status: 'passed' | 'failed';
  steps: Array<{
    text: string;
    status?: 'success' | 'failure';
  }>;
  reason?: Error;
}
