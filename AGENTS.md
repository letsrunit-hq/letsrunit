## Layout

```
apps/
  cli/          Command line interface
  web/          Next.js app
  worker/       Cloud Run service (Cloud Tasks → handle job)
packages/
  ai/           LLM interactions
  bdd/          BDD step definitions
  controller/   browser session & step execution
  executor/     core automation workflows
  gherker/      Gherkin runner
  gherkin/      Gherkin utilities
  journal/      logging & artifacts
  mailbox/      email-based testing
  model/        shared schemas & types
  playwright/   browser utilities
  utils/        common TypeScript utilities
compat/
  react/        React compatibility tests
infra/          GCP deploy scripts
```

---

## Conventions

* Yarn v4 workspaces, TypeScript strict, ESM modules.
* Package names are scoped: `@letsrunit/controller`, etc.
* Format with Prettier defaults.
* Never define function within functions, except for small arrow functions.

## `web` workspace

* Use PrimeReact components and PrimeFlex utilities for all UI.
* Prefer small, purpose-bound React components over large, monolithic ones.
* Use `page.tsx` only for data fetching and composition, not for complex UI logic.
* Treat Server Components as the default, add `'use client'` only when strictly required.
* Client-side data fetching or complex logic is done in dedicated hooks. Components should only handle rendering and composition.
* Put general, reusable styling in the custom PrimeReact theme, use `pt` only for instance-specific styling.
* Use the `cn()` utility for class name composition, avoid string interpolation or ad-hoc concatenation.
* Minimize conditional logic in JSX, prefer composition or dedicated components over nested conditionals.

### Code Generation for using Plop

The `web` workspace uses **Plop** for generating React code.
Agents **must** use Plop instead of manually creating files for components, contexts, or hooks.

_The `worker` and packages workspaces **do not** use Plop._

Run from the repo root:

```bash
yarn workspace web plop <generator> -- --name <Name>
```

Generators:
* component → `src/components/<Name>/<Name>.tsx` + test + index
* hook → `src/hooks/use<Name>.ts` + test
* context → `src/context/<Name>Context.tsx` + test
* page → `src/app/<Name>/page.tsx` + test
* layout → `src/app/<Name>/layout.tsx` + test
* route → `src/app/<Name>/route.tsx` + test
* action (with `use server`) → `src/actions/<Name>.ts` + test
* lib → `src/libs/<Name>.ts` + test

All generators create matching Vitest test files using React Testing Library.

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

* For `web` tests are located next to the source file.
* For all other workspaces tests are located in the `tests` directory.
* When asked to write test files, only write the tests and ensure they run; do not attempt to make failing tests succeed.

All source files should be tested. We're aiming for 100% code coverage. If particular code explicitly can't be tested,
use `/* v8 ignore next [lines] */` or `/* v8 ignore start */`.

When testing components in `web`, mock hooks and functions where possible.

---

## Safe for Agents

✅ modify code/tests in `apps/*` and `packages/*`
✅ adjust Playwright logic
🚫 alter `infra/` or IAM without instruction
