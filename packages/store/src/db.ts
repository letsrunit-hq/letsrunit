import { Database } from 'node-sqlite3-wasm';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,
  started_at  INTEGER NOT NULL,
  git_commit  TEXT
);
CREATE TABLE IF NOT EXISTS features (
  id    TEXT PRIMARY KEY,
  path  TEXT NOT NULL,
  name  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS scenarios (
  id          TEXT PRIMARY KEY,
  feature_id  TEXT NOT NULL REFERENCES features(id),
  name        TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS steps (
  id          TEXT PRIMARY KEY,
  scenario_id TEXT NOT NULL REFERENCES scenarios(id),
  idx         INTEGER NOT NULL,
  text        TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS runs (
  id              TEXT PRIMARY KEY,
  session_id      TEXT NOT NULL REFERENCES sessions(id),
  scenario_id     TEXT NOT NULL REFERENCES scenarios(id),
  status          TEXT NOT NULL DEFAULT 'running',
  failed_step_id  TEXT REFERENCES steps(id),
  error           TEXT,
  started_at      INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS artifacts (
  id        TEXT PRIMARY KEY,
  run_id    TEXT NOT NULL REFERENCES runs(id),
  step_id   TEXT NOT NULL REFERENCES steps(id),
  filename  TEXT NOT NULL
);
`;

export function openStore(path = '.letsrunit/letsrunit.db'): Database {
  const db = new Database(path);
  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}
