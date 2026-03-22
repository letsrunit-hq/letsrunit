## Layout

```
packages/
  letsrunit/    init tool — npx letsrunit init
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

## Conventions

* Yarn v4 workspaces, TypeScript strict, ESM modules.
* Package names are scoped: `@letsrunit/controller`, etc.
* Format with Prettier defaults.
* Never define function within functions, except for small arrow functions.

## Build & Test

```bash
yarn install

# Build all packages
yarn workspaces foreach -pt run build

# Run all tests
yarn test

# Run tests for a single package
yarn test --project @letsrunit/<name>

# Run a single test file
yarn test --project @letsrunit/<name> tests/foo.test.ts

# Watch mode (re-runs affected tests on file change)
yarn test:watch
```

### Testing using Vitest

Testing is done with **vitest**, configured as a workspace at the root (`vitest.config.ts`). There are no per-package test scripts — all test commands run from the repo root.

* Tests are located in the `tests` directory of each package.
* When asked to write test files, only write the tests and ensure they run; do not attempt to make failing tests succeed.

All source files should be tested. We're aiming for 100% code coverage. If particular code explicitly can't be tested,
use `/* v8 ignore next [lines] */` or `/* v8 ignore start */`.

## Workflow

After completing each task:

1. Run the narrowest set of tests that covers the change — a single file, a single package, or all packages — and confirm they pass:
   ```bash
   # Single file
   yarn test --project @letsrunit/<name> tests/foo.test.ts
   # Single package
   yarn test --project @letsrunit/<name>
   ```
2. Commit the changes with a descriptive Conventional Commit message.

Before opening a PR, run the full test suite and confirm everything passes:

```bash
yarn test
```

### Parallel Subtasks

For parallel subtasks that may touch overlapping files, use the `EnterWorktree` tool:

1. Call `EnterWorktree` with a descriptive name — this creates a `git worktree` branched from HEAD at `.claude/worktrees/<name>` and switches the session into it.
2. Do all work within that worktree session.
3. Symlink `node_modules` from the main repo if not present: `ln -s /home/arnold/Projects/letsrunit-app/node_modules ./node_modules`
4. Run the full test suite: `yarn test`
5. Fix any failing tests, then commit. GPG signing works. Use `git commit` normally.
6. Report back when done — the main agent will push and open a pull request. Use HTTPS for push (SSH port 22 is blocked by the sandbox): `git push "https://oauth2:$(gh auth token)@github.com/ORG/REPO.git" BRANCH`

On session exit, Claude will prompt to keep or remove the worktree.

## Documentation

Documentation lives in `docs/` and uses **GitBook syntax**.

Write for developers who are new to the tool. Be concise and task-oriented: lead with what the user needs to do, not with background theory. Use active voice. Prefer examples over explanations.

**Keep docs in sync with code.** When changing behaviour that is documented in `docs/` — e.g. the CLI, step library, init wizard, configuration — update the relevant doc pages in the same commit.

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

| Prefix                            | Effect                |
|-----------------------------------|-----------------------|
| `fix:`                            | patch release (0.0.x) |
| `feat:`                           | minor release (0.x.0) |
| `feat!:` or `BREAKING CHANGE:`    | major release (x.0.0) |
| `chore:`, `docs:`, `ci:`, `test:` | no release            |

A single PR may contain multiple commits — the highest-impact one determines the version bump.

Reference related issues in commit messages. Use `closes #123` (or `fixes #123`) in the commit body when the commit resolves an issue — GitHub will close it automatically on merge.
