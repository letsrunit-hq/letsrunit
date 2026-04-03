![letsrunit](https://cdn.jsdelivr.net/gh/letsrunit-hq/letsrunit@main/docs/.gitbook/assets/logo-light.svg)

# Cucumber

## Installation

```bash
npm install @letsrunit/cucumber
# or
yarn add @letsrunit/cucumber
```

Cucumber CLI integration for letsrunit. It wires the `@letsrunit/bdd` step library into a Cucumber test suite and provides a plugin that persists run history and artifacts to the SQLite store.

This package has four entry points.

## `@letsrunit/cucumber` — support file

Import this in your Cucumber support file (or via `require`/`import` in `cucumber.js`). It:

- Registers all built-in letsrunit BDD step definitions (`Given`/`When`/`Then`) from `@letsrunit/bdd`
- Registers custom parameter types
- Registers the `field` and `date` Playwright selector engines in `BeforeAll`
- Launches a headless Chromium browser in `Before` and closes it in `After`
- Captures a screenshot and HTML snapshot after every step in `AfterStep` (attached to the Cucumber report)

```js
// cucumber.js
export default {
  default: {
    require: ['node_modules/@letsrunit/cucumber/dist/index.js'],
    // ...
  },
};
```

## `@letsrunit/cucumber/store` — plugin

A Cucumber plugin that listens to the message stream and writes structured run data to `.letsrunit/letsrunit.db` (via `@letsrunit/store`). It also saves all step attachments (screenshots, HTML) as content-addressed files under `.letsrunit/artifacts/`.

`pluginOptions.letsrunitStore.directory` is the root letsrunit directory (for example `.letsrunit`), not the artifacts directory.

Recorded data per run:
- Session with the current git commit
- Feature, scenario, and step records (deterministic UUIDs stable across re-runs)
- Run status (`passed` / `failed`) with the failing step and error message
- All step artifacts linked to their step

## `@letsrunit/cucumber/progress` — custom formatter

A drop-in progress-like formatter:

- Successful run output is identical to Cucumber's built-in `progress` formatter
- Failure output is rewritten to a concise `Failures:` block
- For Playwright assertion errors, it prefers the Playwright error detail and locator over wrapper expect text
- If a previous passing baseline exists in `.letsrunit/letsrunit.db`, it prints `Last passed: commit <sha>, <n> commits ago`

```js
// cucumber.js
export default {
  default: {
    format: ['@letsrunit/cucumber/progress'],
    plugin: ['@letsrunit/cucumber/store'],
    pluginOptions: {
      letsrunitStore: {
        directory: '.letsrunit',
      },
    },
    // ...
  },
};
```

## `@letsrunit/cucumber/agent` — NDJSON formatter

Machine-oriented formatter that emits one JSON object per line (NDJSON):

- `run_start`, `scenario_start`, `step_result`, `scenario_end`, `run_end` events
- Failure events include exact raw error text and structured fields (`summary`, `locator`, `url`, etc.)
- When store plugin data is available, failure events include baseline metadata and inline unified HTML diff

```js
// cucumber.js
export default {
  default: {
    format: ['@letsrunit/cucumber/agent'],
    plugin: ['@letsrunit/cucumber/store'],
    pluginOptions: {
      letsrunitStore: {
        directory: '.letsrunit',
      },
    },
  },
};
```

## Testing

```bash
yarn test --project @letsrunit/cucumber
```
