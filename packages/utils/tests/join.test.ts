import { describe, expect, it } from 'vitest';
import { cn, join } from '../src';

describe('join', () => {
  it('flattens nested arrays and filters falsy entries', () => {
    const result = join('-', 'alpha', ['beta', undefined, false], 'gamma');

    expect(result).toBe('alpha-beta-gamma');
  });

  it('applies the glue only between truthy items', () => {
    expect(join('|', undefined, 'left', false, 'right')).toBe('left|right');
    expect(join('/', false, undefined)).toBe('');
  });
});

describe('cn', () => {
  it('returns a space-separated list of class names', () => {
    const className = cn('btn', ['btn-primary', false], undefined, 'active');

    expect(className).toBe('btn btn-primary active');
  });
});
