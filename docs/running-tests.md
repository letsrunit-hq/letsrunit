---
description: Run your feature files with Cucumber or the Letsrunit CLI.
---

# Running Tests

## Cucumber

Cucumber is the primary way to run your test suite. It picks up all `.feature` files, reads configuration from `cucumber.js`, and reports results across all scenarios.

```bash
npx cucumber-js
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

### Plugin

The letsrunit cucumber plugin stores test results with HTML and screenshots for every step, allowing it to create a diff to identify the issue. It also tracks the git commit hash for each test run to show what has changed since the last time a scenario passed.

## Failure explanations

`letsrunit explain` analyzes failures from the latest stored run and prints a human-readable explanation of whether the test likely needs an update or the product likely regressed.

```
features/homepage.feature :: Visitor sees the homepage greeting
  ✔ Given I'm on the homepage
  ✖ Then the page contains text "Hello world"
  - Then I should be on page "/"

  Possible regression
  The page heading text was changed from "Hello world" to "Hllo world", so the expected greeting is missing.
  💡 Fix the homepage text to read exactly "Hello world".
```

If the latest run has no failures, it exits successfully with nothing to explain.

## Running specific files or tags

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

