---
description: Run your feature files with Cucumber or the letsrunit CLI.
---

# Running Tests

## Cucumber

Cucumber is the primary way to run your test suite. It picks up all `.feature` files, reads configuration from `cucumber.js`, and reports results across all scenarios.

```bash
npx cucumber-js
```

### Configuration

`cucumber.js` at the project root configures the test run:

```js
export default {
  timeout: 30_000,
  worldParameters: {
    baseURL: 'http://localhost:3000',
  },
};
```

| Option | Description |
|--------|-------------|
| `worldParameters.baseURL` | Base URL for relative paths in `Given I'm on page` steps |
| `timeout` | Step timeout in milliseconds. Default is 5000; browser steps typically need at least 15000. |

### Running specific files or tags

Run a single feature file:

```bash
npx cucumber-js features/login.feature
```

Run scenarios with a specific tag:

```bash
npx cucumber-js --tags @smoke
```

Tag scenarios in your feature files:

```gherkin
@smoke
Scenario: User logs in
  Given I'm on page "/login"
  ...
```

## letsrunit run

{% hint style="warning" %}
`letsrunit run` is intended for testing letsrunit itself, not for running your test suite. Use Cucumber for that.
{% endhint %}

`letsrunit run` executes a single `.feature` file directly against a URL, without Cucumber configuration.

```bash
letsrunit run <url> <feature>
```

## letsrunit explain

`letsrunit explain` analyzes failures from the latest stored run and prints a human-readable explanation of whether the test likely needs an update or the product likely regressed.

If the latest run has no failures, it exits successfully with nothing to explain.

```bash
letsrunit explain
letsrunit explain --db .letsrunit/letsrunit.db --artifacts .letsrunit/artifacts
```
