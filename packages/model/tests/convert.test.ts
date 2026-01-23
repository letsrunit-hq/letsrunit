import { fixedUUID } from '@letsrunit/utils';
import { describe, expect, it } from 'vitest';
import { RunSchema, toFilter } from '../src';

describe('toFilter', () => {
  it('correctly converts filter object to Supabase filter string', () => {
    const projectId = fixedUUID(1, 'project');
    const filter = { projectId };
    const result = toFilter(RunSchema, filter);

    // data should be { project_id: projectId }
    // parts should be ["project_id=eq.projectId"]
    // result should be "project_id=eq.projectId"

    expect(result).toBe(`project_id=eq.${projectId}`);
  });

  it('handles multiple filter fields', () => {
    const projectId = fixedUUID(1, 'project');
    const featureId = fixedUUID(1, 'feature');
    const filter = { projectId, featureId };
    const result = toFilter(RunSchema, filter);

    // Supabase filter for multiple conditions is comma-separated
    // project_id=eq.uuid,feature_id=eq.uuid
    const parts = result.split(',');
    expect(parts).toContain(`project_id=eq.${projectId}`);
    expect(parts).toContain(`feature_id=eq.${featureId}`);
    expect(parts.length).toBe(2);
  });
});
