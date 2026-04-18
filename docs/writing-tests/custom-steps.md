---
description: Add your own Given/When/Then steps on top of Letsrunit defaults.
---

# Custom Steps

Letsrunit ships with built-in steps from `@letsrunit/cucumber`, but you can add your own step definitions for project-specific behavior.

## Using custom steps

### 1. Create a custom step file

Create `features/support/custom-steps.js`:

```js
import { Then, When } from '@cucumber/cucumber';

When('I open the profile menu', async function () {
  await this.page.getByRole('button', { name: 'Profile' }).click();
});

Then('I should see the signed-in email {string}', async function (email) {
  await this.page.getByText(email, { exact: true }).waitFor();
});
```

`this.page` is the Playwright page provided by Letsrunit's world setup.

### 2. Load your custom steps

In `features/support/world.js`, keep the Letsrunit import and add your custom step file:

```js
import { setDefaultTimeout } from '@cucumber/cucumber';
import '@letsrunit/cucumber';
import './custom-steps.js';

setDefaultTimeout(30_000);
```

### 3. Use the step in your feature

```gherkin
Scenario: Open account menu
  Given I'm on page "/dashboard"
  When I open the profile menu
  Then I should see the signed-in email "user@example.com"
```

## Playwright helper functions

Importing `@letsrunit/playwright` gives you access to robust helpers used by the built-in steps.

### `fuzzyLocator(page, selector)`

Finds an element using Playwright selectors with built-in fallbacks. It's more resilient than `page.locator()` as it attempts to relax role/name filters if a direct match isn't found.

```js
import { fuzzyLocator } from '@letsrunit/playwright';

const button = await fuzzyLocator(this.page, 'button[name="Submit"]');
await button.click();
```

### `setFieldValue(el, value, options?)`

A powerful helper that sets the value of an input element. It automatically detects the type of field (native input, checkbox, radio group, select, or custom ARIA components) and applies the correct interaction.

```js
import { fuzzyLocator, setFieldValue } from '@letsrunit/playwright';

const input = await fuzzyLocator(this.page, 'field="Email"');
await setFieldValue(input, 'user@example.com');
```

### `waitForIdle(page)` and `waitForDomIdle(page)`

Use these to wait for the application to settle.

- `waitForIdle`: Waits for both `domcontentloaded` and `networkidle`.
- `waitForDomIdle`: Waits until the DOM hasn't changed for a short period (default 500ms). Useful for SPAs with ongoing background network activity where `networkidle` might never trigger.

```js
import { waitForDomIdle } from '@letsrunit/playwright';

await this.page.click('.save-button');
await waitForDomIdle(this.page);
```

### `scrollToCenter(locator)`

Scrolls an element into the center of the viewport.

```js
import { fuzzyLocator, scrollToCenter } from '@letsrunit/playwright';

const footer = await fuzzyLocator(this.page, 'footer');
await scrollToCenter(footer);
```

## Tips

* Keep custom steps domain-specific. Reuse built-in Letsrunit steps for common actions.
* Prefer clear, business-readable wording over implementation details.
* If several scenarios share the same setup, move it to `Background`.
