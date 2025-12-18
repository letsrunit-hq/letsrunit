import { describe, expect, it } from 'vitest';
import { isBinary, isPlainObject, isRecord } from '../src';

describe('isBinary', () => {
  it('returns true for Uint8Array instances', () => {
    const input = new Uint8Array([1, 2, 3]);

    expect(isBinary(input)).toBe(true);
  });

  it('returns false for non-binary values', () => {
    expect(isBinary('abc')).toBe(false);
    expect(isBinary({ length: 3 })).toBe(false);
  });
});

describe('isPlainObject', () => {
  it('accepts plain object literals', () => {
    expect(isPlainObject({ a: 1, b: 'two' })).toBe(true);
  });

  it('rejects arrays', () => {
    expect(isPlainObject([1, 2, 3])).toBe(false);
  });

  it('rejects dates and regular expressions', () => {
    expect(isPlainObject(new Date())).toBe(false);
    expect(isPlainObject(/abc/)).toBe(false);
  });

  it('rejects Uint8Array instances', () => {
    expect(isPlainObject(new Uint8Array([4, 5, 6]))).toBe(false);
  });
});

describe('isRecord', () => {
  it('returns true when the value has an id property', () => {
    expect(isRecord({ id: 123, name: 'record' })).toBe(true);
    expect(isRecord({ id: undefined })).toBe(true);
  });

  it('returns false for values without id', () => {
    expect(isRecord({ name: 'missing-id' })).toBe(false);
    expect(isRecord(null)).toBe(false);
    expect(isRecord('id')).toBe(false);
  });
});
