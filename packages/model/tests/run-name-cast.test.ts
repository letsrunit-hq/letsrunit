import { describe, it, expect } from 'vitest';
import { fromData, RunSchema } from '../src';
import { randomUUID } from 'node:crypto';

describe('RunSchema name preprocessing', () => {
  const base = {
    id: randomUUID(),
    type: 'explore',
    project_id: randomUUID(),
    feature_id: null,
    target: 'https://example.com',
    status: 'queued',
    error: null,
    started_at: null,
    finished_at: null,
    created_at: new Date().toISOString(),
    created_by: null,
    updated_at: new Date().toISOString(),
    updated_by: null,
  } as const;

  it('accepts name as string', () => {
    const data = { ...base, name: 'Feature ABC' } as const;
    const run = fromData(RunSchema)(data as any);
    expect(run.name).toBe('Feature ABC');
  });

  it('accepts name as object { name } and casts to string', () => {
    const data = { ...base, name: { name: 'Joined Feature' } } as const;
    const run = fromData(RunSchema)(data as any);
    expect(run.name).toBe('Joined Feature');
  });
});
