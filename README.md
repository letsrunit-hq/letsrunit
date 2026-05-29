![letsrunit](https://cdn.jsdelivr.net/gh/letsrunit-hq/letsrunit@main/docs/.gitbook/assets/logo-light.svg)

letsrunit helps developers and AI coding agents verify web apps in a real browser using plain-language Gherkin tests. Tests are regular `.feature` files, run with Cucumber, and can keep running in CI after the agent session ends.

## Quick Start

Run init in your project:

```bash
npx letsrunit init
```

Init detects your app and guides you through the setup. It can configure browser automation, Cucumber support, AI agent integration, mailbox testing, shared runtime settings, and a GitHub Actions workflow.

## Example

```gherkin
Feature: Checkout

  Scenario: Customer can start checkout
    Given I'm on the homepage
    When I click "Shop"
    And I click "Checkout"
    Then I should see "Payment"
```

## What Init Can Configure

- `.letsrunit/.env` with letsrunit runtime settings such as `LETSRUNIT_BASE_URL`
- Cucumber config and support files for built-in browser steps
- Playwright and Chromium for browser execution
- MCP config and the letsrunit skill for AI coding agents
- Mailbox runtime settings for email-based tests
- GitHub Actions workflow generation for running features in CI

Safe to re-run: init keeps existing files and skips or reports work that is already configured.

## Running Tests

Generated Cucumber projects run with:

```bash
npx cucumber-js
```

If init creates a GitHub Actions workflow, CI starts your app, waits for `LETSRUNIT_BASE_URL`, and then runs the feature suite.

## AI Agents

For AI agents, run `npx letsrunit init` and select the agents you use. Init configures MCP and installs the letsrunit skill so agents know how to write, run, and debug browser tests.

Manual setup and agent-specific details live in [docs/ai-agents.md](docs/ai-agents.md).

## Packages

| Package                                      | Purpose                                           |
| -------------------------------------------- | ------------------------------------------------- |
| [letsrunit](packages/init)                   | Init tool for project setup                       |
| [@letsrunit/cli](packages/cli)               | CLI for generating, running, and explaining tests |
| [@letsrunit/cucumber](packages/cucumber)     | Cucumber integration, formatter, and store plugin |
| [@letsrunit/bdd](packages/bdd)               | Built-in Gherkin step definitions                 |
| [@letsrunit/mcp-server](packages/mcp-server) | MCP server for AI coding agents                   |
| [@letsrunit/mailbox](packages/mailbox)       | Email mailbox helpers for tests                   |

## Development

Read the [development guide](DEVELOPMENT.md).
