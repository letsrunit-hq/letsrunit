import type { StepDefinition, StepHandler } from '../types';

export function Given(expression: string | RegExp, fn: StepHandler, comment?: string): StepDefinition {
  return { type: 'Given', expression, fn, comment };
}

export function When(expression: string | RegExp, fn: StepHandler, comment?: string): StepDefinition {
  return { type: 'When', expression, fn, comment };
}

export function Then(expression: string | RegExp, fn: StepHandler, comment?: string): StepDefinition {
  return { type: 'Then', expression, fn, comment };
}
