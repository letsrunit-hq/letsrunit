---
description: Every available step, organized by category.
---

# Step Reference

## Navigation

| Step | Description |
|------|-------------|
| `Given I'm on the homepage` | Navigate to `/` |
| `Given I'm on page {url}` | Navigate to a path or URL |
| `Given all popups are closed` | Dismiss cookie banners and modal overlays |
| `When I go back to the previous page` | Browser back navigation |

```gherkin
Given I'm on page "/login"
```

## Assert

| Step                                                      | Description |
|-----------------------------------------------------------|-------------|
| `Then the page {contains\|does not contain} {selector}`   | Assert an element is (or is not) visible |
| `Then {selector} {contains\|does not contain} {selector}` | Assert a child element is (or is not) inside a parent |
| `Then I should be on page {url}`                          | Assert the current path (supports `:param` wildcards) |

```gherkin
Then The page contains text "Welcome"
Then The page does not contain button "Sign in"
Then I should be on page "/dashboard"
Then I should be on page "/users/:id/profile"
```

## Mouse

| Step | Description |
|------|-------------|
| `When I {click\|double-click\|right-click\|hover} {selector}` | Interact with an element |
| `When I {click\|double-click\|right-click\|hover} {selector} while holding {keys}` | Interact while holding modifier keys |
| `When I scroll {selector} into view` | Scroll element into the viewport |

```gherkin
When I click button "Sign in"
When I double-click text "Rename"
When I click link "Delete" while holding Shift
When I scroll text "Load more" into view
```

## Form

| Step | Description |
|------|-------------|
| `When I set {selector} to {value}` | Fill an input, select a dropdown option, or toggle a checkbox |
| `When I set {selector} to range of {value} to {value}` | Set a range input |
| `When I clear {selector}` | Clear an input field |
| `When I {check\|uncheck} {selector}` | Check or uncheck a checkbox or switch |
| `When I {focus\|blur} {selector}` | Focus or blur an element |

```gherkin
When I set field "Email" to "user@example.com"
When I set field "Country" to "France"
When I check field "Remember me"
When I clear field "Search"
When I set field "Price range" to range of 10 to 100
```

**Value types:**

| Type | Example |
|------|---------|
| String | `"hello"` |
| Number | `42` |
| Boolean | `true` / `false` |
| Date (absolute) | `date "2025-01-22"` |
| Date (relative) | `date of tomorrow`, `date of 3 days ago`, `date of 8 weeks from now` |
| Generated password | `password of "user-uuid"` |
| Array | `["Option A", "Option B"]` |

To use `password of "..."`, set `LETSRUNIT_PASSWORD_SEED` in your environment.

## Keyboard

| Step | Description |
|------|-------------|
| `When I press {keys}` | Press a key or key combination |
| `When I type {text}` | Type text using the keyboard |

```gherkin
When I press Enter
When I press Control+A
When I press Shift+Tab
When I type "Hello, world"
```

Standard key names: `Enter`, `Tab`, `Escape`, `Space`, `ArrowDown`, `ArrowUp`, `Backspace`.

## Clipboard

| Step | Description |
|------|-------------|
| `When I copy {selector} to the clipboard` | Copy element content to the clipboard |
| `When I paste from the clipboard into {selector}` | Paste clipboard content into a field |

```gherkin
When I copy text "Invoice #1234" to the clipboard
When I paste from the clipboard into field "Reference"
```

## Mailbox

See [Email Testing](email-testing.md) for setup and examples.

| Step | Description |
|------|-------------|
| `When I open the latest email` | Fetch and open the most recent email to the test address |
| `When I click the link in the email` | Click the first link found in the email body |

## Custom steps

You can add your <a href="custom-steps">own step definitions</a> for project-specific behavior.

