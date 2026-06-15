import nodeWasm from 'node-sqlite3-wasm';
const { Database } = nodeWasm;
export type Database = InstanceType<typeof nodeWasm.Database>;

const BUSY_TIMEOUT_MS = 5_000;
const RETRY_DELAYS_MS = [10, 25, 50, 100, 250] as const;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS runs (
  id          BLOB PRIMARY KEY,
  started_at  INTEGER NOT NULL,
  git_commit  TEXT
);
CREATE TABLE IF NOT EXISTS features (
  id    BLOB PRIMARY KEY,
  path  TEXT NOT NULL,
  name  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS scenarios (
  id             BLOB PRIMARY KEY,
  feature        BLOB NOT NULL REFERENCES features(id),
  "index"        INTEGER NOT NULL,
  name           TEXT NOT NULL,
  rule           BLOB,
  outline        BLOB,
  example_row    BLOB,
  example_index  INTEGER,
  UNIQUE(feature, "index"),
  CHECK (outline IS NULL OR example_row IS NOT NULL),
  CHECK (example_row IS NULL OR outline IS NOT NULL)
);
CREATE TABLE IF NOT EXISTS steps (
  id    BLOB PRIMARY KEY,
  text  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS scenario_steps (
  scenario  BLOB NOT NULL REFERENCES scenarios(id),
  "index"   INTEGER NOT NULL,
  step      BLOB NOT NULL REFERENCES steps(id),
  PRIMARY KEY (scenario, "index")
);
CREATE TABLE IF NOT EXISTS tests (
  id                 BLOB PRIMARY KEY,
  run                BLOB NOT NULL REFERENCES runs(id),
  scenario           BLOB NOT NULL REFERENCES scenarios(id),
  status             TEXT NOT NULL DEFAULT 'running',
  failed_step_index  INTEGER,
  error              TEXT,
  started_at         INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS artifacts (
  id          BLOB PRIMARY KEY,
  test        BLOB NOT NULL REFERENCES tests(id),
  step_index  INTEGER NOT NULL,
  filename    TEXT NOT NULL
);
`;

function isLockedError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('database is locked');
}

function sleepSync(delayMs: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delayMs);
}

export function runWithRetry<T>(operation: () => T): T {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return operation();
    } catch (error) {
      if (!isLockedError(error) || attempt >= RETRY_DELAYS_MS.length) {
        throw error;
      }

      sleepSync(RETRY_DELAYS_MS[attempt]);
    }
  }
}

export function openStore(path = '.letsrunit/letsrunit.db'): Database {
  const db = new Database(path);
  runWithRetry(() => {
    db.run(`PRAGMA busy_timeout = ${BUSY_TIMEOUT_MS}`);
    db.run('PRAGMA journal_mode = WAL');
    db.run('PRAGMA foreign_keys = ON');
    db.exec(SCHEMA);
  });
  return db;
}
