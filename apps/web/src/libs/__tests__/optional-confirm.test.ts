import { describe, expect, it } from 'vitest';
import { optionalConfirm } from '../optional-confirm';

describe('optionalConfirm', () => {
  it('is a function', () => {
    expect(typeof optionalConfirm).toBe('function');
  });
});
