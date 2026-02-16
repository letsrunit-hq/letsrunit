# Gherker Package (`@letsrunit/gherker`)

## Installation

```bash
npm install @letsrunit/gherker
# or
yarn add @letsrunit/gherker
```

A lightweight Gherkin microrunner for executing scenarios step-by-step. It provides a simple and fast alternative to full-blown BDD frameworks, optimized for the `letsrunit` platform.

## Exported Classes

### `Runner<TWorld>`

The core class for defining and running Gherkin steps.

#### Methods:

- **`defineStep(type, expression, fn, comment)`**: Defines a new Gherkin step.
    - `type`: `'Given' | 'When' | 'Then' | 'And' | 'But'`.
    - `expression`: A string or regular expression. Supports Cucumber expressions.
    - `fn`: The handler function. Receives arguments from the expression and the world object as `this`.
- **`defineParameterType(type)`**: Registers a custom parameter type for Cucumber expressions.
- **`parse(feature)`**: Parses a Gherkin feature and returns a list of its steps and their matches.
- **`run(feature, worldFactory, wrapRun, opts)`**: Executes a Gherkin feature.
    - `feature`: The Gherkin feature text.
    - `worldFactory`: A value or function that provides the `World` object.
    - `wrapRun`: An optional wrapper for each step execution (useful for logging or reporting).
    - `opts`: Includes an `AbortSignal`.
- **`reset()`**: Clears all defined steps and parameter types.

## Testing

Run tests for this package:

```bash
yarn test
```
