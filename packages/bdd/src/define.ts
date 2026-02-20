import { After, Before, BeforeAll, defineParameterType, Given, Then, When } from '@cucumber/cucumber';
import { browse, createDateEngine, createFieldEngine } from '@letsrunit/playwright';
import { chromium, selectors } from '@playwright/test';
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

let selectorsRegistered = false;

BeforeAll(async function () {
  if (selectorsRegistered) return;
  try {
    await selectors.register('field', createFieldEngine);
    await selectors.register('date', createDateEngine);
    selectorsRegistered = true;
  } catch {}
});

Before(async function () {
  const browser = await chromium.launch({ headless: true });
  this._browser = browser;
  this.page = await browse(browser, this.parameters);
  this.startTime = Date.now();
});

After(async function () {
  await this._browser?.close();
});
