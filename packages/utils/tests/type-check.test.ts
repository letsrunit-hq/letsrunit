import { describe, expect, it } from 'vitest';
import { isBinary, isEntity, isRecord } from '../src';

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

describe('isRecord', () => {
  it('accepts plain object literals', () => {
    expect(isRecord({ a: 1, b: 'two' })).toBe(true);
  });

  it('rejects arrays', () => {
    expect(isRecord([1, 2, 3])).toBe(false);
  });

  it('rejects dates and regular expressions', () => {
    expect(isRecord(new Date())).toBe(false);
    expect(isRecord(/abc/)).toBe(false);
  });

  it('rejects Uint8Array instances', () => {
    expect(isRecord(new Uint8Array([4, 5, 6]))).toBe(false);
  });
});

describe('isEntity', () => {
  it('returns true when the value has an id property', () => {
    expect(isEntity({ id: 123, name: 'record' })).toBe(true);
    expect(isEntity({ id: undefined })).toBe(true);
  });

  it('returns false for values without id', () => {
    expect(isEntity({ name: 'missing-id' })).toBe(false);
    expect(isEntity(null)).toBe(false);
    expect(isEntity('id')).toBe(false);
  });
});
