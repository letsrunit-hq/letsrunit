![letsrunit](https://cdn.jsdelivr.net/gh/letsrunit-hq/letsrunit@main/docs/.gitbook/assets/logo-light.svg)

# Store

## Installation

```bash
npm install @letsrunit/store
# or
yarn add @letsrunit/store
```

SQLite-backed persistence layer for letsrunit run history and artifacts. It manages the database schema and provides write functions for recording runs, features, scenarios, rules/outline metadata, tests, steps, and file artifacts.

## Schema

The store maintains seven tables:

| Table | Purpose |
|---|---|
| `runs` | One row per top-level invocation, keyed by a hash ID with optional git commit |
| `features` | Gherkin feature files, keyed by hash of ordered scenario IDs |
| `scenarios` | Executable scenarios (including outline rows), with nullable `rule`, `outline`, and `example_row` grouping fields |
| `steps` | Canonical normalized step definitions, keyed by step-text hash |
| `scenario_steps` | Ordered step placement for each scenario |
| `tests` | One row per scenario execution within a run; status is `running`, `passed`, or `failed` |
| `artifacts` | Files (screenshots, HTML snapshots) produced at a scenario step index in a test |

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
| `upsertScenario(db, id, featureId, index, name, refs?)` | Inserts or replaces a scenario record |
| `upsertStep(db, id, text)` | Inserts or replaces a canonical step record |
| `upsertScenarioStep(db, scenarioId, index, stepId)` | Inserts or replaces a scenario-step mapping |
| `insertTest(db, id, runId, scenarioId, startedAt)` | Starts a new test with status `running` |
| `finaliseTest(db, id, status, failedStepIndex?, error?)` | Updates a test's final status and optional failure details |
| `insertArtifact(db, id, testId, stepIndex, filename)` | Links a saved file to a specific step index in a test |
| `findLastPassingBaseline(db, scenarioId, allowedCommits?)` | Returns latest passing test id + run commit for a scenario |
| `findLastRun(db)` | Returns latest run metadata and all tests (with ordered scenario steps) in that run |

## Testing

```bash
yarn test --project @letsrunit/store
```
