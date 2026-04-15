---
description: Feature file format, scenarios, and custom parameter types.
---

# Gherkin Basics

Gherkin is the plain-English format letsrunit uses for test scenarios. Each `.feature` file describes one feature and one or more scenarios.

## File structure

```gherkin
Feature: Shopping cart

  Background:
    Given I'm on page "/shop"

  Scenario: Add item to cart
    When I click button "Add to cart"
    Then The page contains text "1 item in cart"

  Scenario: Remove item from cart
    When I click button "Add to cart"
    And I click button "Remove"
    Then The page contains text "Cart is empty"
```

| Keyword | Purpose |
|---------|---------|
| `Feature` | Names the feature being tested (one per file) |
| `Background` | Steps that run before every scenario in the file |
| `Scenario` | A single test case |
| `Given` | Sets up the initial state |
| `When` | Describes an action |
| `Then` | Asserts an outcome |
| `And` / `But` | Continues the previous `Given`, `When`, or `Then` |

## With and without Background

{% tabs %}
{% tab title="With Background" %}
Use `Background` when most scenarios share the same starting point.

```gherkin
Feature: Dashboard

  Background:
    Given I'm on page "/login"
    When I set field "Email" to "admin@example.com"
    And I set field "Password" to "secret"
    And I click button "Sign in"

  Scenario: View user list
    When I click link "Users"
    Then The page contains text "All users"

  Scenario: View settings
    When I click link "Settings"
    Then The page contains text "Account settings"
```
{% endtab %}

{% tab title="Without Background" %}
Without `Background`, each scenario is fully self-contained.

```gherkin
Feature: Dashboard

  Scenario: View user list
    Given I'm on page "/dashboard"
    When I click link "Users"
    Then The page contains text "All users"

  Scenario: View settings
    Given I'm on page "/dashboard"
    When I click link "Settings"
    Then The page contains text "Account settings"
```
{% endtab %}
{% endtabs %}

## Custom parameter types

letsrunit extends Cucumber with three parameter types used across the step library:

| Type | Accepts | Example |
|------|---------|---------|
| `{locator}` | Any locator expression | `button "Sign in"`, `field "Email"`, `` `#submit` `` |
| `{value}` | String, number, date expression, generated password, or array | `"hello"`, `42`, `date of tomorrow`, `password of "user-uuid"`, `["A", "B"]` |

`password of "..."` requires the `LETSRUNIT_PASSWORD_SEED` environment variable.
| `{keys}` | Quoted key or key combination | `"Enter"`, `"Control+A"`, `"Shift+Tab"` |

See [Locators](locators.md) for the full locator syntax and [Step Reference](step-reference.md) for every available step.
