import type Database from 'better-sqlite3';

export function insertSession(db: Database.Database, id: string, gitCommit: string | null, startedAt: number): void {
  db.prepare('INSERT OR IGNORE INTO sessions (id, started_at, git_commit) VALUES (?, ?, ?)').run(id, startedAt, gitCommit);
}

export function upsertFeature(db: Database.Database, id: string, path: string, name: string): void {
  db.prepare('INSERT OR REPLACE INTO features (id, path, name) VALUES (?, ?, ?)').run(id, path, name);
}

export function upsertScenario(db: Database.Database, id: string, featureId: string, name: string): void {
  db.prepare('INSERT OR REPLACE INTO scenarios (id, feature_id, name) VALUES (?, ?, ?)').run(id, featureId, name);
}

export function upsertStep(db: Database.Database, id: string, scenarioId: string, idx: number, text: string): void {
  db.prepare('INSERT OR REPLACE INTO steps (id, scenario_id, idx, text) VALUES (?, ?, ?, ?)').run(id, scenarioId, idx, text);
}

export function insertRun(db: Database.Database, id: string, sessionId: string, scenarioId: string, startedAt: number): void {
  db.prepare('INSERT INTO runs (id, session_id, scenario_id, started_at) VALUES (?, ?, ?, ?)').run(id, sessionId, scenarioId, startedAt);
}

export function finaliseRun(db: Database.Database, id: string, status: string, failedStepId?: string, error?: string): void {
  db.prepare('UPDATE runs SET status = ?, failed_step_id = ?, error = ? WHERE id = ?').run(status, failedStepId ?? null, error ?? null, id);
}

export function insertArtifact(db: Database.Database, id: string, runId: string, stepId: string, filename: string): void {
  db.prepare('INSERT INTO artifacts (id, run_id, step_id, filename) VALUES (?, ?, ?, ?)').run(id, runId, stepId, filename);
}
