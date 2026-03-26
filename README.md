![letsrunit](https://cdn.jsdelivr.net/gh/letsrunit-hq/letsrunit@main/docs/.gitbook/assets/logo-light.svg)

letsrunit is a browser testing tool that describes what your app should do in plain language rather than code. Tests are written in Gherkin, run by Cucumber.js, and integrate into any CI pipeline as standard files. You can write them by hand, generate them from a live URL, or let your AI coding agent produce them as part of its normal workflow.

## Getting Started

Run the init tool inside your project:

```bash
npx letsrunit init
```

This will:
- Install `@letsrunit/cli` as a local devDependency
- Install `@letsrunit/bdd` and create `cucumber.js` if `@cucumber/cucumber` is detected
- Create a `features/` directory with an example feature file

Safe to re-run — all steps are idempotent.

## CLI

The CLI is installed locally by `letsrunit init`. Run it via `npx letsrunit` or `yarn letsrunit`.

| Command | Description |
|---------|-------------|
| `letsrunit explore <url>` | Open a browser, let the AI explore the site, and optionally save a `.feature` file |
| `letsrunit generate <url>` | Generate a Gherkin feature from instructions provided on stdin |
| `letsrunit run <url> <feature>` | Execute a `.feature` file against the given URL |

**Options** (all commands): `-v` / `--verbose`, `-s` / `--silent`, `-o` / `--save <path>`

## MCP Server

The MCP server lets AI coding agents (Claude Code, Cursor, Codex, etc.) launch browsers, run Gherkin steps,
take screenshots, and inspect pages directly inside your editor.

### Install

**Claude Code** — add the marketplace once, then install the plugin to get both the MCP server and skill:

```
/plugin marketplace add letsrunit-hq/agent
/plugin install letsrunit@letsrunit
```

**Other agents** — add to your MCP config manually:

```json
{
  "mcpServers": {
    "letsrunit": {
      "command": "npx",
      "args": ["-y", "@letsrunit/mcp-server"]
    }
  }
}
```

### Agent Skill

The letsrunit skill gives your agent built-in knowledge of the Gherkin step library, locator syntax,
and test-writing workflow. Requires the MCP server to be configured first.

The skill is included automatically when using the Claude Code plugin above. For other agents run

```
npx skills add letsrunit-hq/agent
```

## Development

Read the [development guide](DEVELOPMENT.md).
