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

It stores test results with HTML and screenshots for every step, allowing it to create a diff to identify the issue. It also tracks the git commit hash for each test run to show what has changed since the last time a scenario passed.

```bash
letsrunit explain
```

The output identifies the failing step, the URL, and the specific locator that failed:

```
Scenario: Visitor sees the homepage greeting # features/homepage.feature:3
   Last passed: commit d498a33, 1 commit ago
   ✔ Before
   ✔ Given I'm on the homepage
   ✖ Then the page contains text "Hello world"
       URL: /
       Locator: text=/Hello world/i
       Error: element(s) not found
   - And I should be on page "/"
   ✔ After
```

If the latest run has no failures, it exits successfully with nothing to explain.

```bash
letsrunit explain --db .letsrunit/letsrunit.db --artifacts .letsrunit/artifacts
```
