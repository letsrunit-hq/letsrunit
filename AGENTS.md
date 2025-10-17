## Layout

```
apps/
  web/      Next.js app (dev can run Playwright directly)
  worker/   Cloud Run service (Pub/Sub → start job)
  runner/   Cloud Run Job (Playwright sandbox)
packages/
  core/       shared types, zod
  controller/ playwright flows
  executor/   shared browser orchestration
infra/        GCP deploy scripts
```

---

## Conventions

* Yarn v4 workspaces, TypeScript strict, ESM modules.
* Package names are scoped: `@letsrunit/core`, etc.
* Format with Prettier defaults.
* Never define function within functions.

## Code Generation for `web` (Plop)

The `web` workspace uses **Plop** for generating React code.
Agents **must** use Plop instead of manually creating files for components, contexts, or hooks.
This ensures consistent structure, naming, and test coverage.

_The `runner`, `worker` and packages workspaces **do not** use Plop._

### Usage

Plop is only configured in the `web` workspace.

Run from the repo root:

```bash
yarn workspace web plop <generator> -- --name <Name>
```

### Generators

* **component** → `src/components/<Name>/<Name>.tsx` + test + index
* **hook** → `src/hooks/use<Name>.ts` + test
* **context** → `src/context/<Name>Context.tsx` + test
* **page** → `src/app/<Name>/page.tsx` + test
* **layout** → `src/app/<Name>/layout.tsx` + test
* **route** → `src/app/<Name>/route.tsx` + test
* **action** (with `use server`) → `src/actions/<Name>.ts` + test
* **lib** → `src/libs/<Name>.ts` + test

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

All source files should be tested. We're aiming for 100% code coverage. If particular code explicitly can't be tested,
use `/* v8 ignore next [lines] */` or `/* v8 ignore start */`.

When testing components in `web`, mock hooks and functions where possible.

---

## Safe for Agents

✅ modify code/tests in `apps/*` and `packages/*`
✅ adjust Playwright logic
🚫 alter `infra/` or IAM without instruction
