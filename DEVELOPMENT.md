## Packages

Shared logic is divided into specialised, scoped packages (`@letsrunit/*`):

- [`@letsrunit/ai`](./packages/ai): Interactions with LLMs, including prompt engineering and result parsing.
- [`@letsrunit/bdd`](./packages/bdd): Reusable BDD step definitions for browser automation.
- [`@letsrunit/cli`](./packages/cli): Command-line interface for running tests locally.
- [`@letsrunit/controller`](./packages/controller): Manages browser session lifecycles and orchestrates Gherkin step execution.
- [`@letsrunit/executor`](./packages/executor): High-level engine implementing the core `explore`, `generate`, and `run` workflows.
- [`@letsrunit/gherker`](./packages/gherker): Lightweight Gherkin runner.
- [`@letsrunit/gherkin`](./packages/gherkin): Utilities for modelling and manipulating Gherkin documents.
- [`@letsrunit/journal`](./packages/journal): Hierarchical logging system with pluggable sinks and artifact management.
- [`@letsrunit/mailbox`](./packages/mailbox): Integration for email-based testing workflows.
- [`@letsrunit/mcp-server`](./packages/mcp-server): MCP server exposing letsrunit tools to AI agents.
- [`@letsrunit/playwright`](./packages/playwright): Low-level browser automation utilities and element discovery.
- [`@letsrunit/utils`](./packages/utils): Common TypeScript utilities shared across packages.

## Development

### Prerequisites

- Node.js ≥ 20
- Yarn v4

### Setup

```bash
yarn install
```

### Running the CLI

```bash
yarn cli
# or directly
yarn workspace @letsrunit/cli dev
```

### Running the MCP server

```bash
yarn workspace @letsrunit/mcp-server dev
```

## Testing

Testing is done with **Vitest**. Tests live in the `tests/` directory of each package.

```bash
# Single file
yarn workspace <name> vitest run tests/foo.test.ts

# Single workspace
yarn workspace <name> test

# All packages
yarn workspaces foreach -pt run test
```

### Compatibility tests

Framework-specific compatibility suites verify the automation engine against real component libraries:

- [`compat/react`](./compat/react): React-specific patterns (hydration, async state, MUI, Radix, etc.)

## Publishing

Merging to `main` triggers **semantic-release**, which bumps versions, publishes all packages to npm, and creates a GitHub release. Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/) — `fix:` for patches, `feat:` for minor releases, `feat!:` or `BREAKING CHANGE:` for major releases.
