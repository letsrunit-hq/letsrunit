# Controller Package (`@letsrunit/controller`)

## Installation

```bash
npm install @letsrunit/controller
# or
yarn add @letsrunit/controller
```

Orchestrates Playwright sessions and executes Gherkin scenarios. This package serves as the bridge between high-level Gherkin steps and low-level browser automation.

## Exported Classes

### `Controller`

The main class for managing browser sessions and executing tests.

#### Methods:

- **`static launch(options)`**: Launches a new browser instance and returns a `Controller` instance.
    - `options`: Includes `headless` mode, `storageState`, and `viewport` settings.
- **`run(feature, opts)`**: Executes a Gherkin feature.
    - `feature`: The parsed Gherkin document.
    - `opts`: Options for the run, such as a journal for logging.
- **`validate(feature)`**: Validates that all steps in a feature have matching definitions.
- **`listSteps(type)`**: Returns a list of available step definitions, optionally filtered by type (`'Given' | 'When' | 'Then'`).
- **`close()`**: Closes the browser and cleans up resources.
- **`makeScreenshot(options)`**: Captures a screenshot of the current page.
- **`makeHtmlFile()`**: Captures the current HTML state of the page.

## Testing

Run tests for this package:

```bash
yarn test
```
