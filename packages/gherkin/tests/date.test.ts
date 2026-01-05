import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseDateString } from '../src/date';

describe('parseDateString', () => {
  beforeEach(() => {
    // Set system time to 2026-01-05 13:14:00
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 5, 13, 14, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should parse "today"', () => {
    const result = parseDateString('today');
    expect(result.getTime()).toBe(new Date(2026, 0, 5, 13, 14, 0).getTime());
  });

  it('should parse "tomorrow"', () => {
    const result = parseDateString('tomorrow');
    expect(result.getTime()).toBe(new Date(2026, 0, 6, 13, 14, 0).getTime());
  });

  it('should parse "yesterday"', () => {
    const result = parseDateString('yesterday');
    expect(result.getTime()).toBe(new Date(2026, 0, 4, 13, 14, 0).getTime());
  });

  it('should parse "5 days ago"', () => {
    const result = parseDateString('5 days ago');
    expect(result.getTime()).toBe(new Date(2025, 11, 31, 13, 14, 0).getTime());
  });

  it('should parse "10 minutes from now"', () => {
    const result = parseDateString('10 minutes from now');
    expect(result.getTime()).toBe(new Date(2026, 0, 5, 13, 24, 0).getTime());
  });

  it('should parse "1 year from now"', () => {
    const result = parseDateString('1 year from now');
    expect(result.getTime()).toBe(new Date(2027, 0, 5, 13, 14, 0).getTime());
  });

  it('should parse "2 months ago"', () => {
    const result = parseDateString('2 months ago');
    expect(result.getTime()).toBe(new Date(2025, 10, 5, 13, 14, 0).getTime());
  });

  it('should parse "1 week from now"', () => {
    const result = parseDateString('1 week from now');
    expect(result.getTime()).toBe(new Date(2026, 0, 12, 13, 14, 0).getTime());
  });

  it('should parse "3 hours ago"', () => {
    const result = parseDateString('3 hours ago');
    expect(result.getTime()).toBe(new Date(2026, 0, 5, 10, 14, 0).getTime());
  });

  it('should parse "30 seconds from now"', () => {
    const result = parseDateString('30 seconds from now');
    expect(result.getTime()).toBe(new Date(2026, 0, 5, 13, 14, 30).getTime());
  });

  it('should parse "today at 12:00:15"', () => {
    const result = parseDateString('today at 12:00:15');
    expect(result.getTime()).toBe(new Date(2026, 0, 5, 12, 0, 15).getTime());
  });

  it('should parse "today at 12:00"', () => {
    const result = parseDateString('today at 12:00');
    expect(result.getTime()).toBe(new Date(2026, 0, 5, 12, 0, 0).getTime());
  });

  it('should parse "tomorrow 15:30:45"', () => {
    const result = parseDateString('tomorrow 15:30:45');
    expect(result.getTime()).toBe(new Date(2026, 0, 6, 15, 30, 45).getTime());
  });

  it('should parse quoted date strings', () => {
    const result = parseDateString('"2026-02-01T10:00:00Z"');
    expect(result.toISOString()).toBe('2026-02-01T10:00:00.000Z');
  });

  it('should throw error for invalid date strings', () => {
    expect(() => parseDateString('invalid')).toThrow('Invalid date string: invalid');
  });

  it('should throw error for invalid relative amount', () => {
    expect(() => parseDateString('5 invalid ago')).toThrow('Invalid date string: 5 invalid ago');
  });

  it('should throw error for invalid quoted date', () => {
    expect(() => parseDateString('"invalid date"')).toThrow('Invalid date string: "invalid date"');
  });
});
