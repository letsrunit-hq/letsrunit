---
description: How letsrunit identifies elements on the page.
---

# Locators

letsrunit resolves locators in priority order: accessible names first, then visible text, then raw selectors. Prefer descriptive locators over attribute-based ones. They survive UI changes better.

## Locator patterns

| Pattern | Example | Matches |
|---------|---------|---------|
| `button "text"` | `button "Sign in"` | `<button>` by visible text or `aria-label` |
| `link "text"` | `link "Home"` | `<a>` by link text |
| `field "label"` | `field "Email"` | `<input>` by label text, placeholder, or `aria-label` |
| `text "content"` | `text "Welcome"` | Any element containing the text (substring match) |
| `image "alt"` | `image "Logo"` | `<img>` by `alt` attribute |
| `date "value"` | `date "2025-01-22"` | Element by a specific date |
| `date of {expr}` | `date of tomorrow` | Relative date expression |
| `{role} "name"` | `menuitem "Profile"` | Element by ARIA role and accessible name |
| `{tag}` | `section` | HTML tag name |
| `` `selector` `` | `` `.btn-primary` `` | Raw Playwright/CSS selector |

## Scoping and filtering

**Scope** a locator to a parent element with `within`:

```gherkin
When I click button "Submit" within `#checkout-form`
```

To target elements inside an iframe, scope with `within iframe "..."`:

```gherkin
When I click button "Submit" within iframe "ownable widget"
```

The iframe name matches case-insensitively against iframe `title`, `name`, `aria-label`, or `id`.
If multiple iframes match, the step fails and you should use a more specific name.

**Filter** by descendants with `with` or `without`:

```gherkin
Then the page contains section with button "Save"
Then the page contains section without text "Expired"
```

## Relative dates

```gherkin
When I set field "Appointment" to date of tomorrow
When I set field "Appointment" to date of 3 days ago
When I set field "Appointment" to date of 8 weeks from now
When I set field "Appointment" to date of 1 week from now at 20:00
```

## When to use raw selectors

Use a raw `` `selector` `` when no natural-language locator reliably identifies the element, for example elements with no accessible name or visible text:

```gherkin
# Toggle-all checkbox has no visible label
When I click `#toggle-all`
```

{% hint style="warning" %}
Raw selectors are fragile. Prefer `field`, `button`, `link`, or `text` locators wherever possible. Fall back to a raw selector only when the element has no accessible name or meaningful visible text.
{% endhint %}

## Common pitfalls

**Ambiguous locator:** if multiple elements match, the step fails. Narrow the match with `within` or use a more specific pattern.

**Element not visible:** letsrunit waits for elements to be visible before interacting. If the step times out, check whether the element is hidden behind a modal or requires scrolling.

**Dynamic text:** for text that changes (user names, IDs, timestamps), use a partial match with `text "..."` rather than `button` or `link` which match more exactly.
