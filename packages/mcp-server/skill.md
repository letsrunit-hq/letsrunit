# letsrunit

letsrunit generates and runs browser tests using Gherkin (Given/When/Then) syntax.
Use the `letsrunit` MCP tools to control a real browser and produce `.feature` files.

## MCP Tools

| Tool | Description |
|------|-------------|
| `letsrunit_session_start` | Launch a browser. Returns `{ sessionId }`. Does **not** navigate. |
| `letsrunit_run` | Execute Gherkin steps or a full feature. Returns `{ success, url, artifacts, logs, error? }`. Does **not** return HTML. |
| `letsrunit_snapshot` | Get page HTML on demand. Accepts `selector` and scrub options. |
| `letsrunit_screenshot` | Take a screenshot. Accepts `selector` (crop) and `highlight` (outline elements). |
| `letsrunit_debug` | Evaluate JavaScript on the current page. Returns `{ result, error? }`. For debugging only. |
| `letsrunit_session_close` | Close the browser and clean up. |
| `letsrunit_list_sessions` | List all active sessions. |

## Writing Tests

Tests are written in Gherkin. Every test must start with a `Given I'm on page` step to navigate.

```gherkin
Feature: Login

Scenario: User logs in with valid credentials
  Given I'm on page "/login"
  When I set "email" to "user@example.com"
  And I set "password" to "secret"
  And I click "Sign in"
  Then The page contains "Dashboard"
  And I should be on page "/dashboard"
```

## Available Steps

### Given

| Step | Description |
|------|-------------|
| `Given I'm on the homepage` | Navigate to `/` |
| `Given I'm on page {string}` | Navigate to a path, e.g. `"/login"` |
| `Given all popups are closed` | Dismiss cookie banners and modal overlays |

### When (Actions)

| Step | Description |
|------|-------------|
| `When I {click\|double-click\|right-click\|hover} {locator}` | Interact with an element |
| `When I {click\|double-click\|right-click\|hover} {locator} while holding {keys}` | Interact while holding modifier keys |
| `When I scroll {locator} into view` | Scroll element into the viewport |
| `When I set {locator} to {value}` | Fill an input, select a dropdown option, or toggle a checkbox/switch |
| `When I set {locator} to range of {value} to {value}` | Set a range input |
| `When I clear {locator}` | Clear an input field |
| `When I {check\|uncheck} {locator}` | Check or uncheck a checkbox or switch |
| `When I {focus\|blur} {locator}` | Focus or blur an element |
| `When I press {keys}` | Press a key or key combination, e.g. `Enter`, `Control+A` |
| `When I type {string}` | Type text using the keyboard |
| `When I copy {locator} to the clipboard` | Copy element content to clipboard |
| `When I paste from the clipboard into {locator}` | Paste clipboard content into a field |
| `When I go back to the previous page` | Browser back navigation |

### Then (Assertions)

| Step | Description |
|------|-------------|
| `Then The page {contains\|not contains} {locator}` | Assert an element is (or is not) visible on the page |
| `Then {locator} {contains\|not contains} {locator}` | Assert a child element is (or is not) inside a parent element |
| `Then I should be on page {string}` | Assert the current path matches exactly (supports `:param` patterns) |

## Locators

Locators are resolved in priority order. Use the most natural description:

1. **Visible text** — `"Sign in"`, `"Submit"`
2. **Placeholder** — `"Email address"`, `"Search…"`
3. **aria-label** — matches the `aria-label` attribute
4. **name attribute** — matches the `name` attribute on inputs
5. **CSS selector** — `"#submit-btn"`, `".modal button"`

## Values for `I set {locator} to {value}`

- **String** — `"hello"` fills a text input
- **Number** — `42` fills a number input
- **Boolean** — `true` / `false` checks/unchecks a checkbox or switch
- **Array** — `["Option A", "Option B"]` selects multiple options in a multi-select

## Key combinations for `I press {keys}`

Use standard key names: `Enter`, `Tab`, `Escape`, `Space`, `ArrowDown`, etc.
Modifier combos: `Control+A`, `Shift+Tab`, `Meta+K`.

## Workflow: Generating a Test

1. **`letsrunit_session_start`** — launch the browser (no navigation)
2. **`letsrunit_run`** with `Given I'm on page "/path"` — navigate to the target URL
3. Examine `url` and, when needed, call **`letsrunit_snapshot`** to inspect the DOM
4. Propose **When** steps in small batches, run them, observe the resulting `url` and any changed artifacts
5. Generate **Then** assertions based on what actually happened on the page
6. **`letsrunit_session_close`** when done
7. Return the complete Gherkin feature

## Debugging Tips

- If a step fails, call **`letsrunit_snapshot`** with a `selector` to inspect the relevant DOM subtree
- Use **`letsrunit_screenshot`** with `highlight` to visually confirm which element was found
- Use **`letsrunit_debug`** to run arbitrary JS, e.g. `document.querySelector('#login-btn')?.textContent`
- Locator not found? Try a broader selector or inspect the HTML for the actual text/attribute

## Gherkin Rules

- Use `And` after the first step of a type (Given/When/Then) — the runner treats `And` as the same type as the preceding keyword
- `But` is also accepted as an alias
- One scenario per `letsrunit_run` call (the runner does not support multiple scenarios in one call)
- Step text is case-insensitive for the `contains` / `not contains` / `check` / `uncheck` etc. options
