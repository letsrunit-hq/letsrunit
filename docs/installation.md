---
description: Set up letsrunit in your project with a single command.
---

# Installation

## Prerequisites

* Node.js 20 or later
* An existing project directory

## Run the installer

```bash
npx letsrunit init
```

`init` is interactive: it walks you through each step and asks before making changes. It's safe to re-run at any time.

### What does the installer do?

{% stepper %}
{% step %}
## Install the CLI

`@letsrunit/cli` is added to your project's dev dependencies. It provides the `letsrunit` binary for `explore`, `generate`, and `run`.
{% endstep %}

{% step %}
## Install Cucumber

letsrunit uses [Cucumber.js](https://cucumber.io/) as the test runner. If it's not already installed, the wizard will offer to add `@cucumber/cucumber` to your dev dependencies.

It also creates two files:

**`cucumber.js`** tells Cucumber where your app is running:
```js
export default {
  worldParameters: {
    baseURL: 'http://localhost:3000',
  },
};
```

**`features/support/world.js`** loads the letsrunit step library:
```js
import { setDefaultTimeout } from '@cucumber/cucumber';
import '@letsrunit/cucumber';

setDefaultTimeout(30_000);
```
{% endstep %}

{% step %}
## Create the features directory

If your project has no `.feature` files yet, `init` creates `features/example.feature` with a minimal scenario to verify the setup works:

```gherkin
Feature: Example
  Scenario: Homepage loads
    Given I'm on the homepage
```
{% endstep %}

{% step %}
## Install Playwright browsers

letsrunit drives a real Chromium browser. If Playwright's Chromium binary isn't found, the wizard offers to install it:

```bash
npx playwright install chromium
```
{% endstep %}

{% step %}
## Add a GitHub Action (optional)

The final step offers to scaffold a `.github/workflows/letsrunit.yml` that runs your features on every push and pull request. See [CI/CD](ci-cd/github-actions.md) for the full workflow.
{% endstep %}
{% endstepper %}

{% hint style="info" %}
Run `npx letsrunit init` again at any time to add steps you skipped the first time.
{% endhint %}
