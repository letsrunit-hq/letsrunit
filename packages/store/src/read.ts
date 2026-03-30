import type { Database } from './db';

export function findLastTest(
  db: Database,
  scenarioId: string,
  status?: string,
  allowedCommits?: string[],
): { id: string; gitCommit: string | null } | null {
  const conditions: string[] = ['t.scenario_id = ?'];
  const params: (string | number | null)[] = [scenarioId];

  if (status !== undefined) {
    conditions.push('t.status = ?');
    params.push(status);
  }

  if (allowedCommits !== undefined) {
    conditions.push('r.git_commit IN (SELECT value FROM json_each(?))');
    params.push(JSON.stringify(allowedCommits));
  }

  const sql = `
    SELECT t.id, r.git_commit
    FROM tests t
    JOIN runs r ON t.run_id = r.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY t.started_at DESC
    LIMIT 1
  `;

  const row = db.get(sql, params) as { id: string; git_commit: string | null } | undefined;
  if (!row) return null;
  return { id: row.id, gitCommit: row.git_commit };
}

export function findArtifacts(
  db: Database,
  testId: string,
  stepId?: string,
): Array<{ filename: string; stepId: string; stepIdx: number }> {
  const conditions: string[] = ['a.test_id = ?'];
  const params: (string | number | null)[] = [testId];

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
