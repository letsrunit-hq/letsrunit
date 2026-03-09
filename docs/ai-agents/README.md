---
description: Let your AI coding agent verify its work against a real browser and leave behind tests that keep running.
---

# AI Agent Integration

AI coding agents work at the code level. They read files, make changes, and reason about whether those changes are correct, but they have no way to verify how the UI actually behaves. For that, you need a browser.

letsrunit gives the agent a real Chromium browser it can control through a set of MCP tools. The agent navigates to a page, interacts with elements, and checks what the browser renders. When a step fails, it can read the DOM to understand why, adjust the locator or the step, and try again. It is not running a fixed script. It is iterating the same way a developer would when testing manually.

This is useful on its own as a verification step. The agent finishes implementing something, runs through the flow in a browser, and confirms the result is correct before the task is closed. If the browser shows something unexpected, the agent finds out now rather than later.

The session also produces a `.feature` file that gets committed to the repository and runs in CI on every subsequent build. This means browser testing becomes part of how the agent finishes a task, not a separate activity. Fixing a bug includes verifying the fix in the browser. Adding a feature includes running the end-to-end flow. If a later change breaks the same flow, the test will catch it.

## How it works

The integration has two parts.

**The MCP server** runs a real browser and exposes it as tools the agent can call: start a session, run Gherkin steps, take screenshots, read the DOM, evaluate JavaScript. When a step fails, the agent reaches for `letsrunit_snapshot` to inspect the relevant DOM subtree, adjusts its approach, and retries without surfacing the failure to you unless it genuinely can't recover.

**The skill** is a context document that gives the agent deep knowledge of letsrunit: the full step library, the locator language, how to handle edge cases, when to use a snapshot vs a screenshot vs raw JavaScript. Without it, the agent can call the tools but won't know how to use them well. With it, it writes correct Gherkin from the start and handles failures on its own.

## Setup

{% tabs %}
{% tab title="Claude Code" %}
The letsrunit plugin installs both the MCP server and the skill automatically. Run inside Claude Code:

```
/plugin marketplace add letsrunit-hq/agent
/plugin install letsrunit@letsrunit
```

That's it. On the next conversation, Claude has everything it needs. Just describe what you want tested.
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

{% tab title="Codex CLI" %}
Add the MCP server to `~/.codex/config.toml`:

```toml
[[mcp_servers]]
name = "letsrunit"
command = "npx"
args = ["-y", "@letsrunit/mcp-server@latest"]
```

Install the skill into your repo. Codex discovers skills in `.agents/skills/` automatically:

```bash
mkdir -p .agents/skills/letsrunit
curl -o .agents/skills/letsrunit/SKILL.md \
  https://raw.githubusercontent.com/letsrunit-hq/agent/main/skills/letsrunit/SKILL.md
```

Codex loads it when you ask it to write or run browser tests.
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

Then load the skill into your agent's system context or custom instructions:

```
https://github.com/letsrunit-hq/agent/blob/main/skills/letsrunit/SKILL.md
```
{% endtab %}
{% endtabs %}

## AGENTS.md

Add the following to your `AGENTS.md` or `CLAUDE.md` to instruct the agent to verify its work with letsrunit and store passing tests as regression tests:

```markdown
## Browser testing

Use letsrunit to verify any task that changes UI behaviour.

A task is not complete until the relevant flow has been tested in a real browser and passes.

When a scenario passes:

- Save it as a `.feature` file under `/features`
- Include it in the commit
- These files run in CI as regression tests for future changes

Only keep scenarios that cover flows that could plausibly break from an unrelated change. Skip trivial or redundant ones.
```

{% hint style="info" %}
#### Try Test-Driven Development for better results
For a more structured approach, you can instruct the agent to write scenarios before implementing. See [Test-Driven Development](tdd.md) for instructions to use instead of the ones above.
{% endhint %}

## letsrunit vs Playwright MCP

Playwright MCP is commonly used to verify that a new feature works before marking a task complete. letsrunit is a better choice for this, for one reason: the output.

A Playwright MCP session ends when the conversation ends. The agent clicked through the flow, things looked correct, and now there is no record of any of it. A letsrunit session ends with a `.feature` file that gets committed, runs in CI, and will catch any future change that breaks the same flow. The verification work is the same. The outcome is fundamentally different.

The abstraction level also matters. Playwright MCP exposes raw browser primitives: `browser_click`, `browser_fill_form`, `browser_navigate`. These are automation tools: you're scripting the browser. letsrunit steps describe behaviour: `I click button "Sign in"`, `The page contains text "Dashboard"`. The resulting `.feature` file communicates what the application is supposed to do, not how the automation was written. It is readable by anyone on the team and reviewable in a pull request.

Locator resolution is also handled. Finding the right element (by label text, role, visible text, or a combination) is something letsrunit's step library does for you. With Playwright MCP, the agent writes selectors and handles edge cases itself. With letsrunit, the agent describes what it wants and the library finds it.

Playwright MCP is the right tool for one-off browser automation: scraping, form filling, tasks where no persistent output is needed. For verifying that a feature works, letsrunit produces a better outcome for the same amount of work.

