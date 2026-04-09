![letsrunit](https://cdn.jsdelivr.net/gh/letsrunit-hq/letsrunit@main/docs/.gitbook/assets/logo-light.svg)

# letsrunit Installer

Installer package for bootstrapping letsrunit in an existing project.

Run:

```bash
npx letsrunit init
```

## What `init` does

`init` is interactive by default and safe to rerun.

It can:

- Install `@letsrunit/cli`
- Install `@letsrunit/mcp-server` (project-local MCP runtime)
- Install `@cucumber/cucumber` when missing
- Install `@letsrunit/cucumber` and scaffold Cucumber support
- Create `features/example.feature` when no feature files exist
- Install Playwright Chromium when missing
- Optionally add `.github/workflows/letsrunit.yml`

## Options

- `-y, --yes`  
  Skip confirmation prompts and apply defaults.

- `--no-mcp`  
  Skip installation of `@letsrunit/mcp-server`.

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
