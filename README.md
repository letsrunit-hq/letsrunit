# Let's Run It

Let's Run It is an AI-powered automation platform designed for "Vibe Testing" and intelligent browser automation. It
leverages Large Language Models (LLMs) and Playwright to explore websites, generate Gherkin-based features, and execute
them as automated tests.

### What is "Vibe Testing"?

"Vibe Testing" is our approach to automation that focuses on **heuristic-based exploration** rather than just rigid,
pre-defined assertions. Instead of only checking if a specific button exists, the AI assesses if the "vibe" of the page
is correct—meaning it looks right, contains the expected information, and offers the intended user journey. It allows
for testing complex, dynamic interfaces where traditional brittle selectors often fail.

---

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

---

## CLI

The CLI is installed locally by `letsrunit init`. Run it via `npx letsrunit` or `yarn letsrunit`.

| Command | Description |
|---------|-------------|
| `letsrunit explore <url>` | Open a browser, let the AI explore the site, and optionally save a `.feature` file |
| `letsrunit generate <url>` | Generate a Gherkin feature from instructions provided on stdin |
| `letsrunit run <url> <feature>` | Execute a `.feature` file against the given URL |

**Options** (all commands): `-v` / `--verbose`, `-s` / `--silent`, `-o` / `--save <path>`

---

## MCP Server

The MCP server lets AI coding agents (Claude Code, Cursor, Codex, etc.) launch browsers, run Gherkin steps,
take screenshots, and inspect pages directly inside your editor.

### Install

**Claude Code** — install the plugin to get both the MCP server and skill in one step:

```
/plugin install github:letsrunit-hq/letsrunit
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

### Tools

| Tool | Description |
|------|-------------|
| `letsrunit_session_start` | Launch a browser session |
| `letsrunit_run` | Execute Gherkin steps or a full feature |
| `letsrunit_snapshot` | Get the current page HTML |
| `letsrunit_screenshot` | Take a screenshot |
| `letsrunit_debug` | Evaluate JavaScript on the page |
| `letsrunit_session_close` | Close the browser session |
| `letsrunit_list_sessions` | List all active sessions |

---

## Agent Skill

The letsrunit skill gives your agent built-in knowledge of the Gherkin step library, locator syntax,
and test-writing workflow. Requires the MCP server to be configured first.

The skill is included automatically when using the Claude Code plugin above. For other agents, copy
[`skills/letsrunit/SKILL.md`](skills/letsrunit/SKILL.md) into your agent's context or rules file.

---

## Development

Read the [development guide](DEVELOPMENT.md).
