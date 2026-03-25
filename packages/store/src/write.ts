import type { Database } from './db';

export function insertSession(db: Database, id: string, gitCommit: string | null, startedAt: number): void {
  db.run('INSERT OR IGNORE INTO sessions (id, started_at, git_commit) VALUES (?, ?, ?)', [id, startedAt, gitCommit]);
}

export function upsertFeature(db: Database, id: string, path: string, name: string): void {
  db.run('INSERT OR REPLACE INTO features (id, path, name) VALUES (?, ?, ?)', [id, path, name]);
}

export function upsertScenario(db: Database, id: string, featureId: string, name: string): void {
  db.run('INSERT OR REPLACE INTO scenarios (id, feature_id, name) VALUES (?, ?, ?)', [id, featureId, name]);
}

export function upsertStep(db: Database, id: string, scenarioId: string, idx: number, text: string): void {
  db.run('INSERT OR REPLACE INTO steps (id, scenario_id, idx, text) VALUES (?, ?, ?, ?)', [id, scenarioId, idx, text]);
}

export function insertRun(db: Database, id: string, sessionId: string, scenarioId: string, startedAt: number): void {
  db.run('INSERT INTO runs (id, session_id, scenario_id, started_at) VALUES (?, ?, ?, ?)', [id, sessionId, scenarioId, startedAt]);
}

export function finaliseRun(db: Database, id: string, status: string, failedStepId?: string, error?: string): void {
  db.run('UPDATE runs SET status = ?, failed_step_id = ?, error = ? WHERE id = ?', [status, failedStepId ?? null, error ?? null, id]);
}

export function insertArtifact(db: Database, id: string, runId: string, stepId: string, filename: string): void {
  db.run('INSERT INTO artifacts (id, run_id, step_id, filename) VALUES (?, ?, ?, ?)', [id, runId, stepId, filename]);
}
