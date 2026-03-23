![letsrunit](https://cdn.jsdelivr.net/gh/letsrunit-hq/letsrunit@main/docs/.gitbook/assets/logo-light.svg)

# Cucumber

## Installation

```bash
npm install @letsrunit/cucumber
# or
yarn add @letsrunit/cucumber
```

Cucumber CLI integration for letsrunit. It wires the `@letsrunit/bdd` step library into a Cucumber test suite and provides a formatter that persists run history and artifacts to the SQLite store.

This package has two entry points.

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

## `@letsrunit/cucumber/store` — formatter

A Cucumber formatter that listens to the message stream and writes structured run data to `.letsrunit/letsrunit.db` (via `@letsrunit/store`). It also saves all step attachments (screenshots, HTML) as content-addressed files under `.letsrunit/artifacts/`.

Recorded data per run:
- Session with the current git commit
- Feature, scenario, and step records (deterministic UUIDs stable across re-runs)
- Run status (`passed` / `failed`) with the failing step and error message
- All step artifacts linked to their step

```js
// cucumber.js
export default {
  default: {
    format: ['@letsrunit/cucumber/dist/store.js'],
    // ...
  },
};
```

## Testing

```bash
yarn test --project @letsrunit/cucumber
```
