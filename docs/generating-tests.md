---
description: Generate Gherkin scenarios from a live URL using AI.
---

# Generating Tests

Generate tests either from an AI agent (through the MCP server) or from the CLI.

## AI Agent

Use your preferred AI coding agent with the letsrunit MCP server to generate and validate tests directly from chat.

Typical flow:

- Connect letsrunit MCP tools in your agent.
- Ask the agent to generate or refine a scenario for a target URL or flow.
- Let the agent run the scenario in a real browser and iterate until it passes.
- Save the passing scenario as a `.feature` regression test.

For setup instructions and supported clients, see [AI Agent Integration](ai-agents/README.md). For a structured red-green workflow, see [Test-Driven Development](ai-agents/tdd.md).

## CLI

The letsrunit cli can generate Gherkin scenarios from a live page. It will navigate to a URL, use an LLM to understand the page and produce steps, run the scenario to confirm it passes, and write a `.feature` file. There are two commands:

- `explore` is interactive: it discovers multiple user stories and lets you pick which ones to generate.
- `generate` takes a description and produces a single scenario directly.

Both commands require an LLM API key. Set either `OPENAI_API_KEY`, `CLAUDE_API_KEY` or `TOGETHER_AI_API_KEY` in your shell or `.env` file before running either command.

### explore

`explore` navigates a page, discovers testable user stories with AI, and presents an interactive menu. Select a story and letsrunit generates the scenario, runs it, and saves it if it passes.

```bash
letsrunit explore <url>
letsrunit explore <url> -o ./features
```

| Flag | Description |
|------|-------------|
| `-o, --save <path>` | Directory to save passing `.feature` files |
| `-v, --verbose` | Show detailed output |
| `-s, --silent` | Only output errors |

**Example:**

```bash
letsrunit explore http://localhost:3000/login -o ./features
```

letsrunit navigates the page, then shows a numbered menu:

```
Login

What do you want to test? Choose one of the following options:
1. User logs in with valid email and password
2. User sees an error when password is incorrect
3. User resets their password via email
4. User stays logged in after refreshing the page
```

Press a number to select a story. letsrunit generates the scenario, runs it, and if it passes, writes the `.feature` file to the `-o` directory. The remaining stories are shown again. Press `Ctrl+C` to exit.

### generate

`generate` takes a plain-English description, navigates the target URL, generates a scenario, runs it to confirm it passes, and writes a `.feature` file.

```bash
echo "<description>" | letsrunit generate <url> -o <directory>
```

| Flag | Description |
|------|-------------|
| `-o, --save <path>` | Directory to write the generated `.feature` file |
| `-v, --verbose` | Show detailed output |
| `-s, --silent` | Only output errors |

**Piped input:**

```bash
echo "Log in with email and password, then verify the dashboard loads" \
  | letsrunit generate http://localhost:3000 -o ./features
```

letsrunit opens the page, works out the steps, runs the scenario, and writes `./features/login.feature`:

```gherkin
Feature: Login

  Scenario: Log in with email and password
    Given I'm on page "/login"
    When I set field "Email" to "user@example.com"
    And I set field "Password" to "secret"
    And I click button "Sign in"
    Then The page contains text "Dashboard"
    And I should be on page "/dashboard"
```

**Interactive input:**

Without piped input, `generate` prompts you to type instructions and finish with `Ctrl+D`:

```bash
letsrunit generate http://localhost:3000 -o ./features
```

```
Enter instructions. Finish with Ctrl-D (Unix/macOS/Linux) or Ctrl-Z then Enter (Windows).
Log in with email and password, then verify the dashboard loads
^D
```

{% hint style="info" %}
`generate` runs the scenario before writing the file. If a step fails, it iterates until the scenario is green or gives up.
{% endhint %}

### LangSmith tracing

To inspect LLM calls made during `explore` or `generate`, enable LangSmith tracing:

| Variable | Description |
|----------|-------------|
| `LANGSMITH_API_KEY` | LangSmith API key |
| `LANGSMITH_PROJECT` | Project name in LangSmith |
