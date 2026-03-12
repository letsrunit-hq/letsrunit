import {
  CucumberExpression,
  ParameterType,
  ParameterTypeRegistry,
  RegularExpression,
} from '@cucumber/cucumber-expressions';
import { ParameterTypeDefinition, sanitizeStepDefinition } from '@letsrunit/gherkin';
import type { IStepRegistry, MatchResult, StepDefinition, StepHandler, StepType, World } from './types';

export class DefaultStepRegistry<TWorld extends World = any> implements IStepRegistry<TWorld> {
  private _paramRegistry = new ParameterTypeRegistry();
  private _defs: StepDefinition<TWorld>[] = [];

  get defs(): StepDefinition<TWorld>[] {
    return this._defs;
  }

  defineStep(type: StepType, expression: string | RegExp, fn: StepHandler<TWorld>, comment?: string): void {
    const expr =
      typeof expression === 'string'
        ? new CucumberExpression(sanitizeStepDefinition(expression), this._paramRegistry)
        : new RegularExpression(expression, this._paramRegistry);
    this._defs.push({ type, expr, fn, source: String(expression), comment });
  }

  defineParameterType(type: ParameterTypeDefinition<unknown>): void {
    this._paramRegistry.defineParameterType(
      new ParameterType(type.name, type.regexp, null, type.transformer, type.useForSnippets),
    );
  }

  match(text: string): MatchResult<TWorld> | null {
    for (const def of this._defs) {
      const args = def.expr.match(text);
      if (args) return { def, values: args.map((a) => a.getValue(null)), args };
    }
    return null;
  }
}
