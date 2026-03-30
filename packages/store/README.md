![letsrunit](https://cdn.jsdelivr.net/gh/letsrunit-hq/letsrunit@main/docs/.gitbook/assets/logo-light.svg)

# Store

## Installation

```bash
npm install @letsrunit/store
# or
yarn add @letsrunit/store
```

SQLite-backed persistence layer for letsrunit run history and artifacts. It manages the database schema and provides write functions for recording runs, features, scenarios, tests, steps, and file artifacts.

## Schema

The store maintains six tables:

| Table | Purpose |
|---|---|
| `runs` | One row per top-level invocation, keyed by UUID with optional git commit |
| `features` | Gherkin feature files, keyed by a content hash of the file |
| `scenarios` | Gherkin scenarios, linked to their feature |
| `steps` | Individual steps within a scenario, ordered by index |
| `tests` | One row per scenario execution within a run; status is `running`, `passed`, or `failed` |
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
| `insertRun(db, id, gitCommit, startedAt)` | Records a new run |
| `upsertFeature(db, id, path, name)` | Inserts or replaces a feature file record |
| `upsertScenario(db, id, featureId, name)` | Inserts or replaces a scenario record |
| `upsertStep(db, id, scenarioId, idx, text)` | Inserts or replaces a step record |
| `insertTest(db, id, runId, scenarioId, startedAt)` | Starts a new test with status `running` |
| `finaliseTest(db, id, status, failedStepId?, error?)` | Updates a test's final status and optional failure details |
| `insertArtifact(db, id, testId, stepId, filename)` | Links a saved file to a specific step in a test |

## Testing

```bash
yarn test --project @letsrunit/store
```
