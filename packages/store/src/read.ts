import type { Database } from './db';

export function findLastRun(
  db: Database,
  scenarioId: string,
  status?: string,
  allowedCommits?: string[],
): { id: string; gitCommit: string | null } | null {
  const conditions: string[] = ['r.scenario_id = ?'];
  const params: (string | number | null)[] = [scenarioId];

  if (status !== undefined) {
    conditions.push('r.status = ?');
    params.push(status);
  }

  if (allowedCommits !== undefined) {
    conditions.push('s.git_commit IN (SELECT value FROM json_each(?))');
    params.push(JSON.stringify(allowedCommits));
  }

  const sql = `
    SELECT r.id, s.git_commit
    FROM runs r
    JOIN sessions s ON r.session_id = s.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY r.started_at DESC
    LIMIT 1
  `;

  const row = db.get(sql, params) as { id: string; git_commit: string | null } | undefined;
  if (!row) return null;
  return { id: row.id, gitCommit: row.git_commit };
}

export function findArtifacts(
  db: Database,
  runId: string,
  stepId?: string,
): Array<{ filename: string; stepId: string; stepIdx: number }> {
  const conditions: string[] = ['a.run_id = ?'];
  const params: (string | number | null)[] = [runId];

  if (stepId !== undefined) {
    conditions.push('a.step_id = ?');
    params.push(stepId);
  }

  const sql = `
    SELECT a.filename, a.step_id, st.idx
    FROM artifacts a
    JOIN steps st ON a.step_id = st.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY st.idx ASC
  `;

  const rows = db.all(sql, params) as Array<{ filename: string; step_id: string; idx: number }>;
  return rows.map((r) => ({ filename: r.filename, stepId: r.step_id, stepIdx: r.idx }));
}
