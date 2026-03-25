![letsrunit](https://cdn.jsdelivr.net/gh/letsrunit-hq/letsrunit@main/docs/.gitbook/assets/logo-light.svg)

# Store

## Installation

```bash
npm install @letsrunit/store
# or
yarn add @letsrunit/store
```

SQLite-backed persistence layer for letsrunit run history and artifacts. It manages the database schema and provides write functions for recording test sessions, features, scenarios, steps, runs, and file artifacts.

## Schema

The store maintains six tables:

| Table | Purpose |
|---|---|
| `sessions` | One row per test run invocation, keyed by UUID with optional git commit |
| `features` | Gherkin feature files, keyed by a content hash of the file |
| `scenarios` | Gherkin scenarios, linked to their feature |
| `steps` | Individual steps within a scenario, ordered by index |
| `runs` | One row per scenario execution within a session; status is `running`, `passed`, or `failed` |
| `artifacts` | Files (screenshots, HTML snapshots) produced during a step |

## API

### `openStore(path?)`

Opens (or creates) the SQLite database at the given path. Defaults to `.letsrunit/letsrunit.db`. Enables WAL mode and foreign key enforcement, and runs the schema migration.

```ts
import { openStore } from '@letsrunit/store';

const db = openStore(); // .letsrunit/letsrunit.db
```

### Write functions

All write functions take a `db` instance as their first argument.

| Function | Description |
|---|---|
| `insertSession(db, id, gitCommit, startedAt)` | Records a new test session |
| `upsertFeature(db, id, path, name)` | Inserts or replaces a feature file record |
| `upsertScenario(db, id, featureId, name)` | Inserts or replaces a scenario record |
| `upsertStep(db, id, scenarioId, idx, text)` | Inserts or replaces a step record |
| `insertRun(db, id, sessionId, scenarioId, startedAt)` | Starts a new run with status `running` |
| `finaliseRun(db, id, status, failedStepId?, error?)` | Updates a run's final status and optional failure details |
| `insertArtifact(db, id, runId, stepId, filename)` | Links a saved file to a specific step in a run |

## Testing

```bash
yarn test --project @letsrunit/store
```
