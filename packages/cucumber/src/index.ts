import { After, AfterStep, Before, BeforeAll, defineParameterType, Given, Then, When } from '@cucumber/cucumber';
import { registry, typeDefinitions } from '@letsrunit/bdd'; // importing bdd registers built-in steps as a side effect
import { sanitizeStepDefinition } from '@letsrunit/gherkin';
import { browse, createDateEngine, createFieldEngine } from '@letsrunit/playwright';
import { chromium, selectors } from '@playwright/test';
import { captureAfterStepArtifacts } from './after-step-artifacts';
import { resolveHeadless, shouldKeepBrowserOpenOnFailure } from './run-policy';

for (const type of typeDefinitions) {
  defineParameterType(type);
}

for (const step of registry.definitions) {
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

Before({ name: 'Launch browser session' }, async function () {
  const browser = await chromium.launch({ headless: resolveHeadless(this.parameters) });
  this._browser = browser;
  this.page = await browse(browser, this.parameters);
  this.startTime = Date.now();
});

After({ name: 'Close browser session' }, async function ({ result }: { result?: { status?: string } }) {
  if (shouldKeepBrowserOpenOnFailure(this.parameters, result?.status)) return;
  await this._browser?.close();
});

AfterStep(async function () {
  await captureAfterStepArtifacts(this);
});
