---
description: Set up Letsrunit in your project with a single command.
---

# Installation

## Prerequisites

- Node.js 20 or later
- An existing project directory

## Run the installer

```bash
npx letsrunit init
```

`init` is safe to re-run at any time.

In an interactive terminal, that command walks through Playwright Chromium, Cucumber, CLI, AI agents, and GitHub Actions one step at a time.

In non-interactive environments, pass the components explicitly:

```bash
npx letsrunit init --with-cucumber --with-playwright
```

For AI agent setup, you can choose explicit agents:

```bash
npx letsrunit init --agents codex,cursor
```

Supported values: `codex`, `cursor`, `claude`, `copilot`, `gemini`, `windsurf`.

If you pass `--agents`, `init` configures the selected agent integrations and installs `@letsrunit/mcp-server`.

If you run `npx letsrunit init` without any `--with-*` flags or `--agents` in a non-interactive terminal, it prints help and exits without changing the project.

### What does the installer do?

{% stepper %}
{% step %}

## Install Playwright browsers

Letsrunit drives a real Chromium browser. Pass `--with-playwright` to install `@playwright/test` and Chromium:

```bash
npx playwright install chromium
```

{% endstep %}

{% step %}

## Install Cucumber

Letsrunit uses [Cucumber.js](https://cucumber.io/) as the test runner. Pass `--with-cucumber` to add `@cucumber/cucumber` and scaffold the Letsrunit Cucumber files.

It also creates two files:

**`cucumber.js`** tells Cucumber where your app is running. New configs load `.letsrunit/.env` and use `LETSRUNIT_BASE_URL` when it is set:

```js
import { isAgentEnvironment, loadLetsrunitEnv, resolveDebugWorldParameters } from '@letsrunit/cucumber/config';

loadLetsrunitEnv();

const { worldParameters } = resolveDebugWorldParameters({
  argv: process.argv,
  baseWorldParameters: {
    baseURL: process.env.LETSRUNIT_BASE_URL ?? 'http://localhost:3000',
  },
});
```

**`features/support/world.js`** loads the Letsrunit step library:

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

## Install the CLI

Pass `--with-cli` to add `@letsrunit/cli` to your project's dev dependencies. It provides the `letsrunit` binary for `explore`, `generate`, and `run`.

In interactive mode, `init` writes letsrunit runtime settings such as `LETSRUNIT_BASE_URL` and mailbox settings to `.letsrunit/.env`. Selecting the CLI also offers to configure AI settings in that file.
{% endstep %}

{% step %}

## Install the MCP server

Pass `--with-mcp` to add `@letsrunit/mcp-server` to your dev dependencies so AI agents can use a project-local MCP server and load your project support files safely.
{% endstep %}

{% step %}

## Add a GitHub Action (optional)

Pass `--with-github-actions` to scaffold a `.github/workflows/letsrunit.yml` that runs your features on every push and pull request. See [CI/CD](ci-cd/github-actions.md) for the full workflow.
{% endstep %}
{% endstepper %}

{% hint style="info" %}
Run `npx letsrunit init` again at any time to add more components.
{% endhint %}
