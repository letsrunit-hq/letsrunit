![letsrunit](https://cdn.jsdelivr.net/gh/letsrunit-hq/letsrunit@main/docs/.gitbook/assets/logo-light.svg)

letsrunit is browser testing in plain language. You describe behavior in Gherkin, execute with Cucumber.js, and keep the resulting `.feature` files as regression tests in your repo.

## Why letsrunit

- Write tests as user behavior, not framework code.
- Run scenarios in a real Chromium browser.
- Store run artifacts (step results, HTML, screenshots) to debug failures.
- Use it manually, from the CLI, or through an AI agent via MCP.

## Quick Start

### Prerequisites

- Node.js 20+
- Existing project directory

### Install and scaffold

```bash
npx letsrunit init
```

`init` is interactive and safe to re-run. It can set up:

- `@letsrunit/cli`
- `@letsrunit/mcp-server` (optional)
- Cucumber config and support files
- example feature file
- Playwright Chromium browser
- GitHub Actions workflow (optional)
- AI agent integrations (optional)

You can target specific agents:

```bash
npx letsrunit init --agents codex,cursor
```

## Write Tests

Create `.feature` files in `features/` using Gherkin.

```gherkin
Feature: Login
  Scenario: User logs in with valid credentials
    Given I'm on page "/login"
    When I set field "Email" to "user@example.com"
    And I set field "Password" to "secret"
    And I click button "Sign in"
    Then I should be on page "/dashboard"
```

Core docs:

- Gherkin basics: `docs/writing-tests/gherkin-basics.md`
- Step reference: `docs/writing-tests/step-reference.md`
- Locator guide: `docs/writing-tests/locators.md`
- Custom steps: `docs/writing-tests/custom-steps.md`
- Email flows: `docs/email-testing.md`

## Generate Tests with AI

letsrunit can generate scenarios from a live app URL, validate them in-browser, and save passing tests.

Set one API key:

- `OPENAI_API_KEY`
- `CLAUDE_API_KEY`
- `TOGETHER_AI_API_KEY`

Interactive story discovery:

```bash
letsrunit explore http://localhost:3000 -o ./features
```

Generate one scenario from instructions:

```bash
echo "Log in and verify dashboard loads" \
  | letsrunit generate http://localhost:3000 -o ./features
```

## Run Tests

Run your full suite:

```bash
npx cucumber-js
```

Run a single feature:

```bash
npx cucumber-js features/login.feature
```

Run by tag:

```bash
npx cucumber-js --tags @smoke
```

Explain the most recent failures:

```bash
letsrunit explain
```

## AI Agent Integration (MCP)

letsrunit provides:

- an MCP server for real browser execution and diagnostics
- an agent skill with letsrunit-specific testing guidance

Project-level setup is done through `npx letsrunit init`. For agent-specific configuration details, see `docs/ai-agents.md`.

## CI/CD

Run feature tests in GitHub Actions on push/PR:

- Start app in background
- Wait until the app URL is reachable
- Run `npx cucumber-js`

Use `docs/ci-cd/github-actions.md` for production-ready templates, including database services, Mailpit email testing, Supabase, and staging URL patterns.

## Documentation

Full docs are in [`docs/`](docs):

- [Introduction](docs/README.md)
- [AI Agents](docs/ai-agents.md)
- [Generating Tests](docs/generating-tests.md)
- [Writing Tests](docs/writing-tests/gherkin-basics.md)
- [Running Tests](docs/running-tests.md)
- [GitHub Actions](docs/ci-cd/github-actions.md)

## Development

See [DEVELOPMENT.md](DEVELOPMENT.md).
