# Compatibility Test: React (`@letsrunit/compat-react`)

Compatibility test suite to ensure `@letsrunit/playwright` and `@letsrunit/executor` work correctly with standard React components and patterns.

## Features

- **Component Testing**: Tests against a suite of common React components (buttons, inputs, dropdowns).
- **State Management**: Verifies that automation handles React's asynchronous state updates correctly.
- **Hydration**: Checks for compatibility with SSR and hydration scenarios.

## Running Tests

```bash
yarn workspace @letsrunit/compat-react test
```
