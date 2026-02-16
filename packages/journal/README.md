# Journal Package (`@letsrunit/journal`)

## Installation

```bash
npm install @letsrunit/journal
# or
yarn add @letsrunit/journal
```

Logging and reporting infrastructure for test execution and AI decision processes. It provides a structured way to capture logs, artifacts (like screenshots), and metadata during automation runs.

## Exported Classes

### `Journal<TSink>`

The main class for logging. It requires a `Sink` to publish entries.

#### Methods:

- **`static nil()`**: Creates a journal with a `NoSink` (logs are ignored).
- **`log(message, options)`**: The base logging method.
- **`debug|info|warn|error(message, options)`**: Standard logging levels.
- **`title(message, options)`**: Logs a title/header.
- **`start|success|failure(message, options)`**: Methods to track the lifecycle of an action.
- **`prepare(message, options)`**: Logs a preparation step.
- **`do(message, callback, metaFn)`**: A wrapper for executing an action. It automatically logs `start`, `success` (with meta/artifacts), or `failure`.
- **`batch()`**: Returns a `JournalBatch` instance for fluent, batched logging.

### `JournalBatch`

A builder-like class for logging multiple entries at once.

## Sinks

Sinks define where the logs are sent:

- **`NoSink`**: Discards all logs.
- **`ConsoleSink`**: Logs to the terminal.
- **`CliSink`**: Advanced console logging with progress indicators and verbosity control.
- **`SupabaseSink`**: Sends logs and artifacts to Supabase for persistence and real-time dashboard updates.

## Testing

Run tests for this package:

```bash
yarn test
```
