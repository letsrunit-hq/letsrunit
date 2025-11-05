import { defineParameterType, Given, When, Then } from '@cucumber/cucumber';
import { typeDefinitions } from './parameters';
import { stepsDefinitions } from './steps';
import { sanitizeStepDefinition } from '@letsrunit/gherkin';

for (const type of typeDefinitions) {
  defineParameterType(type);
}

for (const step of stepsDefinitions) {
  const def = step.type === 'Given' ? Given : step.type === 'When' ? When : Then;
  def(sanitizeStepDefinition(step.expression), step.fn);
}
