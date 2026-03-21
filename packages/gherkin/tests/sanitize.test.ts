import { describe, expect, it } from 'vitest';
import { sanitizeStepDefinition } from '../src/sanitize';

describe('sanitizeStepDefinition', () => {
  it('normalizes placeholders with alternative type hints', () => {
    const step = 'fill {value|string} and {count|int}';
    expect(sanitizeStepDefinition(step)).toBe('fill {value} and {count}');
  });

  it('returns the original regex unchanged', () => {
    const step = /click (.+)/;
    expect(sanitizeStepDefinition(step)).toBe(step);
  });
});
