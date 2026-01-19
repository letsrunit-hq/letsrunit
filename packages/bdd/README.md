# BDD Package (`@letsrunit/bdd`)

Standard BDD step definitions and Playwright utilities for `letsrunit`. It provides the building blocks for creating and executing Gherkin-based automation.

## Exported Components

### `stepsDefinitions`

An array of `StepDefinition` objects that define the standard steps available in the platform. These include:

- **Assert**: Steps for verifying page state (e.g., `I should see "text"`, `the URL should be "url"`).
- **Navigation**: Steps for moving between pages (e.g., `I go to "url"`, `I go back`).
- **Mouse**: Click and hover interactions (e.g., `I click "button"`, `I click on the text "link"`).
- **Form**: Filling and submitting forms (e.g., `I fill "input" with "value"`, `I select "option" from "select"`).
- **Keyboard**: Typing and pressing keys.
- **Mailbox**: Steps for interacting with emails (e.g., `I open the latest email`, `I click the link in the email`).
- **Clipboard**: Steps for verifying and interacting with the clipboard.

### Custom Parameter Types

The package exports several Cucumber parameter types to make steps more readable and powerful:

- `{text}`: For matching quoted or unquoted text.
- `{selector}`: For matching Playwright-compatible selectors.
- `{url}`: For matching URLs.

### `toFile(path)`

A utility to convert a local path or URL to a `File` object, useful for testing file uploads.

## Testing

Run tests for this package:

```bash
yarn test
```
