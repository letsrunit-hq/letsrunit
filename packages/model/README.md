# Model Package (`@letsrunit/model`)

Shared data models, Zod schemas, and database access logic for the `letsrunit` platform. It ensures data consistency across the `web` and `worker` workspaces.

## Exported Components

### Data Models & Schemas

The package exports Zod schemas and TypeScript types for core entities:

- **`Project`**: Represents a project/website being tested.
- **`Feature`**: Represents a Gherkin feature.
- **`Run`**: Represents an automation run (Explore, Generate, or Test).
- **`JournalEntry`**: Represents a single log entry in a run's journal.

### Database Access (Supabase)

The package provides high-level functions for interacting with the Supabase database:

- **Project Management**: `getProject`, `listProjects`, `createProject`, `updateProject`, `deleteProject`.
- **Feature Management**: `getFeature`, `listFeatures`, `createFeature`, `updateFeature`, `deleteFeature`.
- **Run Management**: `getRun`, `listRuns`, `createRun`, `updateRunStatus`.
- **Journal Management**: `listJournalEntries`, `createJournalEntry`.

### Utilities

- **`connect()`**: Establishes a connection to Supabase using environment variables.
- **`authorize(table, id, opts)`**: Ensures the current user has access to a specific record.
- **`DBError`**: A custom error class for handling database-related errors.

## Testing

Run tests for this package:

```bash
yarn test
```
