import nodeWasm from 'node-sqlite3-wasm';
const { Database } = nodeWasm;
export type Database = InstanceType<typeof nodeWasm.Database>;

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

export function openStore(path = '.letsrunit/letsrunit.db'): Database {
  const db = new Database(path);
  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}
