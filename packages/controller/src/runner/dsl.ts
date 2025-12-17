import { stepsDefinitions, typeDefinitions, type World } from '@letsrunit/bdd';
import { Runner } from '@letsrunit/gherker';

export const runner = new Runner<World>();

for (const type of typeDefinitions) {
  runner.defineParameterType(type);
}

for (const step of stepsDefinitions) {
  runner.defineStep(step.type, step.expression, step.fn, step.comment);
}
