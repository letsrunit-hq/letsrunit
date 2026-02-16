# Executor Package (`@letsrunit/executor`)

## Installation

```bash
npm install @letsrunit/executor
# or
yarn add @letsrunit/executor
```

High-level engine for running complex automation tasks. It ties together AI, Controller, and BDD packages to provide the core workflows of the `letsrunit` platform.

## Exported Functions

### `explore(target, opts, process)`

Automatically navigates a website to discover functionality and potential user stories.

- **`target`**: The starting URL.
- **`opts`**: Options like `headless` and `journal`.
- **`process`**: A callback function `(info: AppInfo, actions: PreparedAction[]) => Promise<any>` that is called with the discovered information and actions. Each action in `PreparedAction` has a `run()` method to generate the corresponding feature.

### `generate(target, suggestion, opts)`

Generates full Gherkin features from high-level instructions and real-time page analysis.

- **`target`**: The target URL.
- **`suggestion`**: A `Feature` object (or partial) describing what to generate.
- **`opts`**: Includes `headless`, `journal`, `accounts` (for login), and `timeout`.

### `run(target, feature, opts)`

Executes a given Gherkin feature on a target URL with full reporting.

- **`target`**: The target URL.
- **`feature`**: A `Feature` object or a Gherkin string.
- **`opts`**: Includes `headless` and `journal`.

### `refineSuggestion(suggestion)`

Uses AI to refine and improve a user-provided test suggestion.

## Testing

Run tests for this package:

```bash
yarn test
```
