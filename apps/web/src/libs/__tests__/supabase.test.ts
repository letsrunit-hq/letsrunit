import { describe, expect, it } from 'vitest';
import { connect } from '../supabase/browser';

describe('lib supabase', () => {
  it('is a function', () => {
    expect(typeof connect).toBe('function');
  });
});
