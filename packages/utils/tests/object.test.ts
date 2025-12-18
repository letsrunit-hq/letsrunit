import { describe, expect, it } from 'vitest';

import { clean, pick } from '../src';

describe('clean', () => {
  it('returns primitives and special object instances unchanged', () => {
    const date = new Date();
    const regex = /keep/;
    const bytes = new Uint8Array([1, 2, 3]);

    expect(clean(0)).toBe(0);
    expect(clean('value')).toBe('value');
    expect(clean(true)).toBe(true);
    expect(clean(date)).toBe(date);
    expect(clean(regex)).toBe(regex);
    expect(clean(bytes)).toBe(bytes);
  });

  it('shallowly removes nullish entries from arrays without touching nested values', () => {
    const array = [1, null, undefined, 0, 'x', { nested: null }];

    const result = clean(array);

    expect(result).toEqual([1, 0, 'x', { nested: null }]);
    expect(result).not.toBe(array);
    expect(array).toEqual([1, null, undefined, 0, 'x', { nested: null }]);
  });

  it('shallowly omits nullish properties from plain objects without mutating the source', () => {
    const input = { a: 1, b: null, c: undefined, d: { keep: null }, e: 0 };

    const result = clean(input);

    expect(result).toEqual({ a: 1, d: { keep: null }, e: 0 });
    expect(result).not.toBe(input);
    expect(input).toEqual({ a: 1, b: null, c: undefined, d: { keep: null }, e: 0 });
  });
});

describe('pick', () => {
  it('returns a new object containing only existing keys', () => {
    const source: { a: number; b: number; c?: number } = { a: 1, b: 2 };

    const picked = pick(source, ['a', 'c']);

    expect(picked).toEqual({ a: 1 });
    expect(picked).not.toBe(source);
  });

  it('does not mutate the source object', () => {
    const source = { one: 1, two: 2, three: 3 };

    pick(source, ['one', 'three']);

    expect(source).toEqual({ one: 1, two: 2, three: 3 });
  });
});
