## Layout

```
packages/
  ai/           LLM interactions
  bdd/          BDD step definitions
  controller/   browser session & step execution
  cli/          Command line interface
  executor/     core automation workflows
  gherker/      Gherkin runner
  gherkin/      Gherkin utilities
  journal/      logging & artifacts
  mailbox/      email-based testing
  mcp-server/   MCP server for AI agent integration
  playwright/   browser utilities
  utils/        common TypeScript utilities
compat/
  react/        React compatibility tests
```

---

## Conventions

* Yarn v4 workspaces, TypeScript strict, ESM modules.
* Package names are scoped: `@letsrunit/controller`, etc.
* Format with Prettier defaults.
* Never define function within functions, except for small arrow functions.

---

## Build & Test

```bash
yarn install

# Test single workspace
yarn workspace <name> test

# Build and test all
yarn workspaces foreach -pt run build
yarn workspaces foreach -pt run test
```

### Testing using Vitest

Testing is done with **vitest**.

* Tests are located in the `tests` directory.
* When asked to write test files, only write the tests and ensure they run; do not attempt to make failing tests succeed.

All source files should be tested. We're aiming for 100% code coverage. If particular code explicitly can't be tested,
use `/* v8 ignore next [lines] */` or `/* v8 ignore start */`.

---

## Workflow

After completing each task:

1. Run the narrowest set of tests that covers the change — a single file, a single workspace, or all workspaces — and confirm they pass:
   ```bash
   # Single file
   yarn workspace <name> vitest run tests/foo.test.ts
   # Single workspace
   yarn workspace <name> test
   ```
2. Commit the changes with a descriptive Conventional Commit message.

Before opening a PR, run the full test suite and confirm everything passes:

```bash
yarn workspaces foreach -pt run test
```

---

## Branching & Releases

**Never push directly to `main`.** All changes go through a feature branch and pull request.

```bash
git checkout -b feat/my-feature   # or fix/, chore/, docs/, etc.
# ... make changes ...
git push -u origin feat/my-feature
gh pr create --base main
```

_Do not create a new branch when fixing failing tests in the current branch._

When creating a PR, use the repository's PR template (`.github/PULL_REQUEST_TEMPLATE.md`).

Merging to `main` triggers **semantic-release**, which:
1. Determines the next version from commit messages
2. Updates all `packages/*/package.json` versions
3. Publishes all packages to npm
4. Creates a GitHub release with a generated changelog

**Commits must follow [Conventional Commits](https://www.conventionalcommits.org/)** — the release type is derived from them:

| Prefix | Effect |
|---|---|
| `fix:` | patch release (0.0.x) |
| `feat:` | minor release (0.x.0) |
| `feat!:` or `BREAKING CHANGE:` | major release (x.0.0) |
| `chore:`, `docs:`, `ci:`, `test:` | no release |

A single PR may contain multiple commits — the highest-impact one determines the version bump.

Reference related issues in commit messages. Use `closes #123` (or `fixes #123`) in the commit body when the commit resolves an issue — GitHub will close it automatically on merge.
