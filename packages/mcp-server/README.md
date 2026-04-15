![letsrunit](https://cdn.jsdelivr.net/gh/letsrunit-hq/letsrunit@main/docs/.gitbook/assets/logo-light.svg)

# MCP Server

Gives AI coding agents a real Chromium browser they can control through a set of MCP tools. The agent navigates pages, runs Gherkin steps, inspects the DOM, and takes screenshots — all from within its coding session.

When a scenario passes, it produces a `.feature` file that gets committed and runs in CI on every subsequent build. Browser testing becomes part of how the agent finishes a task, not a separate activity.

## Setup

**Claude Code** — install the plugin to get both the MCP server and the skill:

```
/plugin marketplace add letsrunit-hq/agent
/plugin install letsrunit@letsrunit
```

**Cursor** — add `.cursor/mcp.json` to your project root:

```json
{
  "mcpServers": {
    "letsrunit": {
      "command": "npx",
      "args": ["-y", "@letsrunit/mcp-server@latest"]
    }
  }
}
```

**Codex CLI** — add to `~/.codex/config.toml`:

```toml
[[mcp_servers]]
name = "letsrunit"
command = "npx"
args = ["-y", "@letsrunit/mcp-server@latest"]
```

**Other agents** — standard MCP JSON config:

```json
{
  "mcpServers": {
    "letsrunit": {
      "command": "npx",
      "args": ["-y", "@letsrunit/mcp-server@latest"]
    }
  }
}
```

## Project-local support files

Keep using the same MCP command (`npx -y @letsrunit/mcp-server@latest`).

At runtime, letsrunit checks the current project:

- If the project has `@letsrunit/mcp-server` installed, it hands off to that project-local server and loads support files/custom steps.
- If not, it stays in standalone mode and runs built-in letsrunit steps only.

So custom steps from `features/support/**` are available when `@letsrunit/mcp-server` is installed in that project.

When you edit existing support files during a long-running agent session, call `letsrunit_reload` to rebuild and reload step definitions without restarting the agent.

## Tools

| Tool | Description |
|------|-------------|
| `letsrunit_session_start` | Launch a new browser session. Set `baseURL` to enable relative paths like `Given I'm on the homepage`. |
| `letsrunit_run` | Execute Gherkin steps or a complete feature. Accepts a single step, multiple steps, a Scenario, or a full Feature. |
| `letsrunit_list_steps` | List available step definitions for a session. Optionally filter by `Given`, `When`, or `Then`. |
| `letsrunit_snapshot` | Get the current page HTML, scrubbed for LLM consumption. Scope to a DOM subtree with `selector`. |
| `letsrunit_screenshot` | Take a screenshot. Optionally crop to a selector or highlight elements before capturing. |
| `letsrunit_debug` | Evaluate JavaScript on the current page via `page.evaluate()`. Use for debugging, not test logic. |
| `letsrunit_reload` | Rebuild and reload built-in + project support step definitions after step-file changes. Available in project runtime mode. |
| `letsrunit_diagnostics` | Return runtime diagnostics (`cwd`, `LETSRUNIT_PROJECT_CWD`, detected cucumber config, resolved support entries). Available only when `LETSRUNIT_MCP_DIAGNOSTICS=enabled`. |
| `letsrunit_session_close` | Close a browser session and release its resources. |
| `letsrunit_list_sessions` | List all active browser sessions. |

## Skill

The MCP server exposes the tools, but the skill teaches the agent how to use them well — the full step library, the locator language, and how to handle failures. Without it the agent can call the tools; with it, it writes correct Gherkin from the start.

The skill is included automatically in the Claude Code plugin above. For other agents, load it from:

```
https://github.com/letsrunit-hq/agent/blob/main/skills/letsrunit/SKILL.md
```
