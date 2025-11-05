import { expect } from 'vitest';
import { CucumberExpression, ParameterType, ParameterTypeRegistry, RegularExpression } from '@cucumber/cucumber-expressions';
import { typeDefinitions } from '../src';
import type { StepDefinition, World } from '../src';
import { sanitizeStepDefinition } from '@letsrunit/gherkin';

export async function runStep(def: StepDefinition, text: string, world: World): Promise<void> {
  const registry = new ParameterTypeRegistry();
  for (const t of typeDefinitions) {
    const p = new ParameterType<unknown>(t.name, t.regexp, null, t.transformer, t.useForSnippets);
    registry.defineParameterType(p);
  }

  const expr = typeof def.expression === 'string'
    ? new CucumberExpression(sanitizeStepDefinition(def.expression), registry)
    : new RegularExpression(def.expression, registry);

  const args = expr.match(text);
  expect(args, `Expression did not match: ${text} ~ ${String(def.expression)}`).toBeTruthy();

  const values = (args ?? []).map((a) => a.getValue(null));
  await def.fn(world, ...values);
}
