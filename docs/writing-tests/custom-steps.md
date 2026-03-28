---
description: Add your own Given/When/Then steps on top of letsrunit defaults.
---

# Custom Steps

letsrunit ships with built-in steps from `@letsrunit/cucumber`, but you can add your own step definitions for project-specific behavior.

## 1. Create a custom step file

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

`this.page` is the Playwright page provided by letsrunit's world setup.

## 2. Load your custom steps

In `features/support/world.js`, keep the letsrunit import and add your custom step file:

```js
import { setDefaultTimeout } from '@cucumber/cucumber';
import '@letsrunit/cucumber';
import './custom-steps.js';

setDefaultTimeout(30_000);
```

## 3. Use the step in your feature

```gherkin
Scenario: Open account menu
  Given I'm on page "/dashboard"
  When I open the profile menu
  Then I should see the signed-in email "user@example.com"
```

## Tips

* Keep custom steps domain-specific. Reuse built-in letsrunit steps for common actions.
* Prefer clear, business-readable wording over implementation details.
* If several scenarios share the same setup, move it to `Background`.
