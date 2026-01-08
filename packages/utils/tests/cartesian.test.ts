import { describe, expect, it } from 'vitest';
import { cartesian } from '../src';

describe('cartesian', () => {
  it('should return an empty array if no arrays are provided', () => {
    const result = cartesian();
    expect(result).toEqual([[]]);
  });

  it('should return the original array elements wrapped in arrays if only one array is provided', () => {
    const input = [1, 2, 3] as const;
    const result = cartesian(input);
    expect(result).toEqual([[1], [2], [3]]);
  });

  it('should return the Cartesian product of two arrays', () => {
    const arr1 = [1, 2] as const;
    const arr2 = ['a', 'b'] as const;
    const result = cartesian(arr1, arr2);
    expect(result).toEqual([
      [1, 'a'],
      [1, 'b'],
      [2, 'a'],
      [2, 'b'],
    ]);
  });

  it('should return the Cartesian product of three arrays', () => {
    const arr1 = [1] as const;
    const arr2 = ['a', 'b'] as const;
    const arr3 = [true, false] as const;
    const result = cartesian(arr1, arr2, arr3);
    expect(result).toEqual([
      [1, 'a', true],
      [1, 'a', false],
      [1, 'b', true],
      [1, 'b', false],
    ]);
  });

  it('should return an empty array if any of the input arrays are empty', () => {
    const arr1 = [1, 2] as const;
    const arr2 = [] as const;
    const arr3 = ['a'] as const;
    const result = cartesian(arr1, arr2, arr3);
    expect(result).toEqual([]);
  });

  it('should handle arrays with different types', () => {
    const arr1 = [1, null] as const;
    const arr2 = [undefined, { key: 'value' }] as const;
    const result = cartesian(arr1, arr2);
    expect(result).toEqual([
      [1, undefined],
      [1, { key: 'value' }],
      [null, undefined],
      [null, { key: 'value' }],
    ]);
  });
});
