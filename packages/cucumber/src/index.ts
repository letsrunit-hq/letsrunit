import { After, AfterStep, Before, BeforeAll, defineParameterType, Given, Then, When } from '@cucumber/cucumber';
import { registry, typeDefinitions } from '@letsrunit/bdd'; // importing bdd registers built-in steps as a side effect
import { sanitizeStepDefinition } from '@letsrunit/gherkin';
import { browse, createDateEngine, createFieldEngine, scrubHtml } from '@letsrunit/playwright';
import { chromium, selectors } from '@playwright/test';

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
  const browser = await chromium.launch({ headless: true });
  this._browser = browser;
  this.page = await browse(browser, this.parameters);
  this.startTime = Date.now();
});

After({ name: 'Close browser session' }, async function () {
  await this._browser?.close();
});

AfterStep(async function () {
  const page = this.page;
  if (!page || page.url() === 'about:blank') return;

  try {
    const [screenshot, html] = await Promise.all([
      page.screenshot().catch(() => null),
      scrubHtml(page).catch(() => null),
    ]);

    this.attach(page.url(), 'text/x-letsrunit-url');
    if (screenshot) this.attach(screenshot, 'image/png');
    if (html) this.attach(html, 'text/html');
  } catch {}
});
