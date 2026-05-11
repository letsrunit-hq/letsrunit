![letsrunit](https://cdn.jsdelivr.net/gh/letsrunit-hq/letsrunit@main/docs/.gitbook/assets/logo-light.svg)

# letsrunit Installer

Installer package for bootstrapping letsrunit in an existing project.

Run:

```bash
npx letsrunit init
```

## What `init` does

`init` is safe to rerun.

It can:

- Install `@letsrunit/cli`
- Install `@letsrunit/mcp-server` (project-local MCP runtime)
- Install `@cucumber/cucumber` when missing
- Install `@letsrunit/cucumber` and scaffold Cucumber support
- Create `features/example.feature` when no feature files exist
- Install Playwright Chromium when missing
- Optionally add `.github/workflows/letsrunit.yml`

## Options

- `--with-cli`  
  Install `@letsrunit/cli`.

- `--with-mcp`  
  Install `@letsrunit/mcp-server`.

- `--with-cucumber`  
  Install `@cucumber/cucumber` and scaffold Cucumber support.

- `--with-playwright`  
  Install the Playwright Chromium browser.

- `--with-github-actions`  
  Add `.github/workflows/letsrunit.yml`.

- `--agents <list>`  
  Configure MCP + skill for selected agents (comma-separated): `codex,cursor,claude,copilot,gemini,windsurf`.
  Passing `--agents` also installs `@letsrunit/mcp-server`.

Run `npx letsrunit init` with no options in an interactive terminal to choose components in a prompt.

In non-interactive mode, running `npx letsrunit init` without any `--with-*` flags or `--agents` prints help and exits.

## Generated/updated files

When scaffolding Cucumber support, `init` creates:

- `cucumber.js` (if missing)
- `features/support/world.js` (if missing)
- `features/example.feature` (if no feature files exist)

If `features/support/world.js` already exists and does not import `@letsrunit/cucumber`, `init` does not overwrite it and prints a manual action note.

## Why install `@letsrunit/mcp-server` locally

Agents can keep using:

```bash
npx -y @letsrunit/mcp-server@latest
```

When `@letsrunit/mcp-server` is installed in the project, the MCP process hands off to the project-local server so custom support files/steps can load consistently.

Without a project-local install, MCP runs in standalone mode with built-in steps only.
