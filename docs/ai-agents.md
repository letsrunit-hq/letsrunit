---
description: Let your AI coding agent verify its work against a real browser and leave behind tests that keep running.
---

# AI Agents

AI Agent integration has two parts:

- **The MCP server** runs a real browser and exposes it as tools the agent can call: start a session, run Gherkin steps, take screenshots, read the DOM, evaluate JavaScript, investigate failures.
- **The skill** is a context document that gives the agent deep knowledge of letsrunit. Without it, the agent can call the tools but won't know how to use them well.

## Setup

### Project (recommended)

Install Letsrunit for your project, including the MCP server and skill

```
npx letsrunit init
```

The init script will automatically detect all the components to install and configure.

### Global

You can install the Letsrunit MCP server and skill globally for all your projects.

{% tabs %}
{% tab title="Claude Code" %}
The Letsrunit plugin installs both the MCP server and the skill automatically. Run inside Claude Code:

```
/plugin marketplace add letsrunit-hq/agent
/plugin install letsrunit@letsrunit
```
{% endtab %}

{% tab title="Codex CLI" %}
Add the MCP server to `~/.codex/config.toml`:

```toml
[[mcp_servers]]
name = "letsrunit"
command = "npx"
args = ["-y", "@letsrunit/mcp-server@latest"]
```

Install the skill into your repo.

```bash
npx skills add letsrunit-hq/agent
```

Codex loads it when you ask it to write or run browser tests.
{% endtab %}

{% tab title="Cursor" %}
Add `.cursor/mcp.json` to your project root:

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

Install the skill via the Cursor UI: open **Settings → Rules**, click **Add Rule**, select **Remote Rule (GitHub)**, and enter:

```
https://github.com/letsrunit-hq/agent
```

Cursor loads it automatically when you ask it to write or run browser tests.
{% endtab %}

{% tab title="Other agents" %}
Add the MCP server in your agent's config format. The standard JSON:

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

Then load the skill into your agent's system context:

```
npx skills add letsrunit-hq/agent
```
{% endtab %}
{% endtabs %}

## AGENTS.md

Add the following to your `AGENTS.md` or `CLAUDE.md` to instruct the agent to verify its work with letsrunit and store passing tests as regression tests:

{% tabs %}
{% tab title="Basic" %}
The agent must write a browser test before marking the test as completed.

```markdown
## Browser testing

Use letsrunit to verify any task that changes UI behaviour. A task is not complete until the relevant flow has been tested in a real browser and passes.

When a scenario passes:
- Save it as a `.feature` file under `/features`
- Include it in the commit
- These files run in CI as regression tests for future changes

Only keep scenarios that cover flows that could plausibly break from an unrelated change. Skip trivial or redundant ones.
```
{% endtab %}
{% tab title="TDD" %}
For a more structured approach, you can instruct the agent to write scenarios before implementing.

```markdown
## Test-driven development

When implementing a feature or fixing a bug that affects the UI, use letsrunit to write a tests before writing any implementation code.

1. Write a `.feature` file in `/features` with one or more scenarios, describing the expected user interaction and outcome.
2. Run each scenario with the letsrunit MCP server to confirm it fails. If it passes, either the feature already exists or the scenario is not testing the right thing.
3. Implement until the scenarios pass. Do not write code beyond what is required be make the scenarios pass.
4. Do not modify a scenario to fit the implementation. If the test fails, fix the code.

If you cannot write a scenario before implementing, the requirements are not specific enough. Ask for clarification rather than making assumptions in code.
```
{% endtab %}
{% endtabs %}

