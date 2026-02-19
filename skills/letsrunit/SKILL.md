---
name: letsrunit
description: Generate and execute browser tests using Gherkin (Given/When/Then) syntax via a real Playwright browser. Use when asked to write, run, or debug browser tests, or to automate and verify web UI behaviour.
compatibility: Requires the letsrunit MCP server to be configured. See https://github.com/letsrunit/letsrunit.
---

## MCP Tools

| Tool | Description |
|------|-------------|
| `letsrunit_session_start` | Launch a browser. Returns `{ sessionId }`. Does **not** navigate. |
| `letsrunit_run` | Execute Gherkin steps or a full feature. Returns `{ status, steps, reason?, journal }`. Does **not** return HTML. |
| `letsrunit_snapshot` | Get scrubbed page HTML on demand. Accepts `selector` and scrub options. |
| `letsrunit_screenshot` | Take a screenshot. Accepts `selector` (crop to element) and `mask` (spotlight elements). |
| `letsrunit_debug` | Evaluate JavaScript on the current page. Returns `{ result, error? }`. For debugging only. |
| `letsrunit_session_close` | Close the browser and release its resources. |
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

Locators identify elements on the page. Prefer natural language over raw CSS selectors.

| Pattern | Example | Description |
|---------|---------|-------------|
| `button "text"` | `button "Sign in"` | Button by visible text or aria-label |
| `link "text"` | `link "Home"` | `<a>` tag by its text |
| `field "label"` | `field "Email"` | Input by label text, placeholder, or aria-label |
| `text "content"` | `text "Welcome"` | Any element containing the text |
| `image "alt"` | `image "Logo"` | Image by alt text |
| `date "value"` | `date "2025-01-22"` | Element by specific date |
| `date of {expr}` | `date of tomorrow` | Relative dates (`date of 3 days ago`, `date of 1 week from now at 20:00`) |
| `{role} "name"` | `menuitem "Profile"` | Element by ARIA role |
| `{tag}` | `div`, `section` | HTML tag name |
| `` `selector` `` | `` `.btn-primary` `` | Raw Playwright selector (last resort) |

**Scoping:** `button "Submit" within \`#checkout-form\` — scope to a parent element.
**Filtering:** `section with button "Save"` / `section without text "Expired"` — filter by descendants.

**Rules:** prefer descriptive locators over attribute-based ones; use `link` for `<a>` tags; ensure locators are unambiguous.

## Values

- **String** — `"hello"`
- **Number** — `42`
- **Boolean** — `true` / `false`
- **Date** — `date of tomorrow`, `date of 3 days ago`, `date of 8 weeks from now` or `date "2025-01-22"`
- **Array** — `["Option A", "Option B"]`

## Key Combinations

Standard key names: `Enter`, `Tab`, `Escape`, `Space`, `ArrowDown`.
Modifier combos: `Control+A`, `Shift+Tab`, `Meta+K`.

## Workflow

1. `letsrunit_session_start` — launch the browser (no navigation)
2. `letsrunit_run` with `Given I'm on page "/path"` — navigate to the target URL
3. Call `letsrunit_snapshot` when you need to inspect the DOM
4. Propose **When** steps in small batches, run them, observe `status` and `steps`
5. Generate **Then** assertions based on what actually happened
6. `letsrunit_session_close` when done
7. Return the complete Gherkin feature

## Debugging

- Step failed → `letsrunit_snapshot` with `selector` to inspect the relevant DOM subtree
- Visual confirmation → `letsrunit_screenshot` with `mask` to spotlight the element
- Arbitrary JS → `letsrunit_debug`, e.g. `document.querySelector('#btn')?.textContent`
- Locator not found → try a broader selector or inspect the HTML for the actual text

## Gherkin Rules

- Use `And` after the first step of a type — the runner treats it as the same type as the preceding keyword
- `But` is also accepted as an alias
- One scenario per `letsrunit_run` call
