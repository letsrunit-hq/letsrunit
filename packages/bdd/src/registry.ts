import {
  CucumberExpression,
  ParameterType,
  ParameterTypeRegistry,
  RegularExpression,
} from '@cucumber/cucumber-expressions';
import { sanitizeStepDefinition, type ParameterTypeDefinition } from '@letsrunit/gherkin';
import { typeDefinitions } from './parameters';
import type { StepDefinition, StepHandler, StepType } from './types';

interface Entry {
  type: StepType;
  expression: string | RegExp;
  fn: StepHandler;
  comment?: string;
  expr: CucumberExpression | RegularExpression;
}

export function createRegistry() {
  const _paramRegistry = new ParameterTypeRegistry();
  const _entries: Entry[] = [];

  for (const t of typeDefinitions) {
    _paramRegistry.defineParameterType(
      new ParameterType(t.name, t.regexp, null, t.transformer as any, t.useForSnippets),
    );
  }

  return {
    /** IStepRegistry-compatible defs (source = String(expression), no raw expr). */
    get defs() {
      return _entries.map(({ type, expression, fn, comment }) => ({
        type,
        source: String(expression),
        fn,
        comment,
      }));
    },

    /** Raw step definitions with original expression — used by define.ts for Cucumber registration. */
    get definitions(): StepDefinition[] {
      return _entries.map(({ type, expression, fn, comment }) => ({ type, expression, fn, comment }));
    },

    defineStep(type: StepType, expression: string | RegExp, fn: StepHandler, comment?: string): void {
      const expr =
        typeof expression === 'string'
          ? new CucumberExpression(sanitizeStepDefinition(expression), _paramRegistry)
          : new RegularExpression(expression, _paramRegistry);
      _entries.push({ type, expression, fn, comment, expr });
    },

    defineParameterType(type: ParameterTypeDefinition<unknown>): void {
      _paramRegistry.defineParameterType(
        new ParameterType(type.name, type.regexp, null, type.transformer, type.useForSnippets),
      );
    },

    match(text: string) {
      for (const entry of _entries) {
        const args = entry.expr.match(text);
        if (args) {
          return {
            def: { type: entry.type, source: String(entry.expression), fn: entry.fn, comment: entry.comment },
            values: args.map((a) => a.getValue(null)),
            args,
          };
        }
      }
      return null;
    },
  };
}

export const registry = createRegistry();

export function Given(expression: string | RegExp, fn: StepHandler, comment?: string): StepDefinition {
  const def: StepDefinition = { type: 'Given', expression, fn, comment };
  registry.defineStep('Given', expression, fn, comment);
  return def;
}

export function When(expression: string | RegExp, fn: StepHandler, comment?: string): StepDefinition {
  const def: StepDefinition = { type: 'When', expression, fn, comment };
  registry.defineStep('When', expression, fn, comment);
  return def;
}

export function Then(expression: string | RegExp, fn: StepHandler, comment?: string): StepDefinition {
  const def: StepDefinition = { type: 'Then', expression, fn, comment };
  registry.defineStep('Then', expression, fn, comment);
  return def;
}
