import { Runner, StepHandler } from './Runner';

export const runner = new Runner();

export const Given = (expression: string | RegExp, fn: StepHandler): void => runner.define('Given', expression, fn);
export const When = (expression: string | RegExp, fn: StepHandler): void => runner.define('Given', expression, fn);
export const Then = (expression: string | RegExp, fn: StepHandler): void => runner.define('Given', expression, fn);
