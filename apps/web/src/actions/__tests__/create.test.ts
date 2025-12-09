import { describe, expect, it } from 'vitest';
import { createFeature } from '../create-feature';

describe('action create', () => {
  it('returns ok: true', async () => {
    const res = await createFeature();
    expect(res).toEqual({ ok: true });
  });
});
