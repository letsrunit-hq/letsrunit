import { describe, it, expect } from 'vitest';
import { dummyCache } from '#cache';

describe('dummyCache', () => {
  it('always reports missing entries', () => {
    expect(dummyCache.has('anything')).toBe(false);
    expect(dummyCache.get('anything')).toBeUndefined();
  });

  it('ignores values passed to set', () => {
    dummyCache.set('some-key', 'value');
    expect(dummyCache.get('some-key')).toBeUndefined();
  });
});
