# Gherkin Package (`@letsrunit/gherkin`)

## Installation

```bash
npm install @letsrunit/gherkin
# or
yarn add @letsrunit/gherkin
```

Utilities for parsing and manipulating Gherkin documents. It provides models and functions to work with features, scenarios, and steps.

## Exported Functions

### `makeFeature(feature)`

Generates a formatted Gherkin string from a `Feature` object.

- **`feature`**: An object containing `name`, `description`, `comments`, `background`, and `steps`.

### `parseFeature(input)`

Parses a Gherkin string (or just a list of steps) into a `Feature` object. It handles full features as well as partial scenarios.

### `deltaSteps(steps, newSteps)`

Calculates the difference between two sets of steps, returning only the `newSteps` that are not part of the trailing overlap of the original `steps`. Useful for iterative generation.

### `sanitizeStepDefinition(expression)`

Cleans up a step definition expression, removing leading keywords (Given, When, Then, etc.) and normalizing whitespace.

## Exported Types

- **`Feature`**: Interface representing a Gherkin feature.
- **`ParameterTypeDefinition<T>`**: Interface for defining custom Cucumber parameter types.

## Testing

Run tests for this package:

```bash
yarn test
```
