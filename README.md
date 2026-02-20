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

The MCP server exposes letsrunit tools to AI agents (Claude Code, Claude Desktop, etc.), allowing them to launch
browsers, run Gherkin steps, take screenshots, and inspect pages directly.

### Install

Add to your MCP config (e.g. `.mcp.json` in the project root, or `~/.claude/claude_desktop_config.json` for Claude Desktop):

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

Or with Claude Code CLI:

```bash
claude mcp add letsrunit -- npx -y @letsrunit/mcp-server
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

## Claude Code Skill

Install the letsrunit skill to give Claude Code built-in knowledge of the Gherkin step library, locator syntax,
and test-writing workflow:

```bash
claude skills install github:letsrunit-hq/letsrunit/skills/letsrunit
```

The skill requires the MCP server to be configured first.

---

## Development

Read the [development guide](DEVELOPMENT.md).
