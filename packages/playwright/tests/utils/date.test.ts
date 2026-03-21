import { describe, expect, it } from 'vitest';
import { formatDateForInput } from '../../src/utils/date';

describe('formatDateForInput', () => {
  const date = new Date(2024, 2, 15, 10, 30); // 2024-03-15 10:30

  it('formats as date by default', () => {
    expect(formatDateForInput(date, 'date')).toBe('2024-03-15');
  });

  it('formats as datetime-local', () => {
    expect(formatDateForInput(date, 'datetime-local')).toBe('2024-03-15T10:30');
  });

  it('formats as month', () => {
    expect(formatDateForInput(date, 'month')).toBe('2024-03');
  });

  it('formats as time', () => {
    expect(formatDateForInput(date, 'time')).toBe('10:30');
  });

  it('formats as number (timestamp)', () => {
    expect(formatDateForInput(date, 'number')).toBe(String(date.getTime()));
  });

  it('formats as week', () => {
    const result = formatDateForInput(date, 'week');
    // 2024-03-15 is week 11
    expect(result).toMatch(/^2024-W\d{2}$/);
  });

  it('defaults to date format for unknown type', () => {
    expect(formatDateForInput(date, null)).toBe('2024-03-15');
    expect(formatDateForInput(date, 'unknown')).toBe('2024-03-15');
  });
});
