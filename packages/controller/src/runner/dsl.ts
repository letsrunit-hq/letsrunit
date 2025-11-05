import { Runner } from '@letsrunit/gherker';
import { World } from '../types';
import { typeDefinitions, stepsDefinitions } from '@letsrunit/bdd';

export const runner = new Runner<World>();

for (const type of typeDefinitions) {
  runner.defineParameterType(type);
}

for (const step of stepsDefinitions) {
  runner.defineStep(step.type, step.expression, step.fn, step.comment);
}
