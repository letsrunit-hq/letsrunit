import { describe, expect, it } from 'vitest';
import { ensureSignedIn } from '../auth';

describe('ensureSignedIn', () => {
  it('is a function', () => {
    expect(typeof ensureSignedIn).toBe('function');
  });
});
