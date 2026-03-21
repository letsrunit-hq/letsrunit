import { describe, expect, it } from 'vitest';
import { expectOrNot } from '../../src/utils/test-helpers';

describe('expectOrNot', () => {
  it('returns regular expect chain when toBe=true', () => {
    expect(() => expectOrNot(3, true).toBe(3)).not.toThrow();
  });

  it('returns negated expect chain when toBe=false', () => {
    expect(() => expectOrNot(3, false).toBe(4)).not.toThrow();
  });
});
