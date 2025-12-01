import { Expression } from '@cucumber/cucumber-expressions';

export type World = { cleanup?: () => void | Promise<void>; [_: string]: any };
export type StepHandler<T> = (world: T, ...args: any[]) => Promise<void> | void;
export type StepType = 'Given' | 'When' | 'Then';

export interface StepDefinition<T> {
  type: StepType;
  expr: Expression;
  fn: StepHandler<T>;
  source: string;
  comment?: string;
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
