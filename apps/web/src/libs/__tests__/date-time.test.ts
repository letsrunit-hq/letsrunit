import { describe, expect, it } from 'vitest';
import { formatDateTime, formatDurationMs } from '../date-time';

describe('formatDurationMs', () => {
  it('is a function', () => {
    expect(typeof formatDurationMs).toBe('function');
  });
});

describe('formatDateTime', () => {
  it('is a function', () => {
    expect(typeof formatDateTime).toBe('function');
  });
});
