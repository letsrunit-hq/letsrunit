# Let's Run It

Let's Run It is an AI-powered automation platform designed for "Vibe Testing" and intelligent browser automation. It
leverages Large Language Models (LLMs) and Playwright to explore websites, generate Gherkin-based features, and execute
them as automated tests.

### What is "Vibe Testing"?

"Vibe Testing" is our approach to automation that focuses on **heuristic-based exploration** rather than just rigid,
pre-defined assertions. Instead of only checking if a specific button exists, the AI assesses if the "vibe" of the page
is correct—meaning it looks right, contains the expected information, and offers the intended user journey. It allows
for testing complex, dynamic interfaces where traditional brittle selectors often fail.

The project is a monorepo managed with Yarn v4 workspaces, designed for scalability and shared logic across different
execution environments.

## Architecture & Data Flow

Understanding how a request moves through the system:

1. **Web Dashboard (`apps/web`)**: A user triggers a new "Run" (Explore, Generate, or Test).
2. **Database (`Supabase`)**: The run is recorded in the `runs` table with a `queued` status.
3. **Task Queue (`Google Cloud Tasks`)**: In production, the Web app pushes a task to Cloud Tasks.
4. **Worker (`apps/worker`)**:
  * **Production**: Cloud Tasks triggers the Worker's HTTP server (`POST /tasks/run`).
  * **Development**: The Worker listener (`yarn workspace worker dev`) polls/subscribes to Supabase for new `queued`
    runs.
5. **Execution Loop (`@letsrunit/executor`)**:
  * The Worker invokes the `executor` to perform the work.
  * The `executor` uses `@letsrunit/ai` to make decisions and `@letsrunit/controller` (via Playwright) to interact with
    the browser.
  * Logs and artifacts (screenshots) are streamed back to Supabase and GCS via `@letsrunit/journal`.
6. **Realtime Feedback**: The Web dashboard reflects progress in real-time by listening to Supabase changes.

## Apps

### Web

The central dashboard and management interface. Built with Next.js and React, it allows users to manage projects, review
test results, and trigger new automation runs. It communicates with Supabase for data and Google Cloud Tasks for
queueing.
[Read more](./apps/web)

### CLI

A developer-focused command-line tool for running exploration and generation locally. It's useful for debugging and
rapid development of automation logic without needing the full web stack.
[Read more](./apps/cli)

### Worker

A stateless Cloud Run service that performs the actual automation work. It processes tasks from Google Cloud Tasks,
executes Playwright flows, and streams logs back to the database.
[Read more](./apps/worker)

## Packages

Shared logic is divided into specialized, scoped packages (`@letsrunit/*`):

- [`@letsrunit/ai`](./packages/ai): Handles interactions with LLMs, including prompt engineering and result parsing.
- [`@letsrunit/bdd`](./packages/bdd): Provides a library of reusable BDD step definitions and Gherkin utilities.
- [`@letsrunit/controller`](./packages/controller): Manages browser session lifecycles and orchestrates Gherkin step
  execution.
- [`@letsrunit/executor`](./packages/executor): The high-level engine implementing the core `explore`, `generate`, and
  `run` workflows.
- [`@letsrunit/gherker`](./packages/gherker): A lightweight, fast Gherkin runner optimized for this platform.
- [`@letsrunit/gherkin`](./packages/gherkin): Utilities for modeling and manipulating Gherkin documents.
- [`@letsrunit/journal`](./packages/journal): A hierarchical logging system that supports multiple sinks (Supabase,
  Console) and artifact management.
- [`@letsrunit/mailbox`](./packages/mailbox): Integration for email-based testing workflows using services like Mailpit
  or Testmail.
- [`@letsrunit/model`](./packages/model): Shared Zod schemas, TypeScript types, and database access logic.
- [`@letsrunit/playwright`](./packages/playwright): Low-level browser automation utilities and intelligent element
  discovery.
- [`@letsrunit/utils`](./packages/utils): Common TypeScript utilities used across the monorepo.

## Database & Multi-tenancy

- **[Supabase](https://supabase.com)**: Used as the primary backend, providing PostgreSQL, Authentication, and Realtime
  capabilities.
- **[Basejump](https://usebasejump.com)**: Integrated into Supabase to provide robust multi-tenancy, team management,
  permissions, and billing support out of the box.

## Infrastructure & CI

- **GCP Native Workers**: The automation engine runs on Google Cloud Run, allowing for effortless scaling and
  pay-per-use execution.
- **Cloud Tasks**: Managed queueing via Google Cloud Tasks ensures reliable asynchronous execution of test runs.
- **CI/CD**: Handled via GitHub Actions, deploying the web app to Vercel and workers to GCP. See the [`infra/`](./infra)
  directory for deployment scripts and configuration.

## Development

### Prerequisites

- Yarn v4
- Node.js (ESM)
- Docker (for local Supabase and Mailpit)

### Setup & Local Development

1. **Install dependencies**:
   ```bash
   yarn install
   ```

2. **Start Supabase**:
   The project relies on Supabase for the database, auth, and realtime.
   ```bash
   yarn supabase start
   ```

3. **Environment Variables**:
   Environment variables are managed per-app. Refer to the `README.md` in each app directory for required keys:
  - [`apps/web/README.md`](./apps/web#environment-variables)
  - [`apps/worker/README.md`](./apps/worker#environment-variables)

4. **Start the Services**:
   In separate terminals, run:
   ```bash
   # Web app
   yarn workspace web dev

   # Worker (listener mode for local dev)
   yarn workspace worker dev
   ```

### Code Generation (Plop)

The `web` workspace uses **Plop** to ensure consistent code structure and test coverage. **Always use Plop** instead of
manually creating files for components, hooks, or actions in `apps/web`.

```bash
yarn workspace web plop <generator> -- --name <Name>
```

*Generators: `component`, `hook`, `context`, `page`, `layout`, `route`, `action`, `lib`.*

## Testing

We employ a multi-layered testing strategy to ensure reliability across all components.

### Unit Tests

Each package and app contains its own suite of unit tests using **Vitest**. We aim for high code coverage for all
business logic.

```bash
# Run all unit tests
yarn workspaces foreach -pt run test
```

### Compatibility Tests

To ensure the automation engine works reliably across different frontend frameworks and patterns, we maintain
framework-specific compatibility suites:

- **[React Compatibility](./compat/react)**: Verifies handling of React-specific patterns like hydration and
  asynchronous state updates.

## Deployment

The platform is designed for automated deployment:

- **Web**: Deployed to Vercel on every push to `main`.
- **Worker**: Built as a Docker container and deployed to Google Cloud Run. Detailed instructions are available in the [
  `infra/`](./infra) README.
