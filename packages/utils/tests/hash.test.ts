import { createHash } from 'node:crypto';
import stringify from 'fast-json-stable-stringify';
import { describe, expect, it } from 'vitest';

import { hash } from '../src';

const helloSha256 = '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824';

const stableObject = { b: 2, a: 1 } as const;
const stableObjectHash = createHash('sha256').update(stringify(stableObject)).digest('hex');

describe('hash', () => {
  it('hashes string inputs directly', () => {
    expect(hash('hello')).toBe(helloSha256);
  });

  it('stringifies plain objects using fast-json-stable-stringify', () => {
    expect(hash(stableObject)).toBe(stableObjectHash);
  });

  it('accepts Uint8Array inputs without stringification', () => {
    const payload = new Uint8Array([1, 2, 3]);
    const expected = createHash('sha256').update(payload).digest('hex');

    expect(hash(payload)).toBe(expected);
  });

  it('produces stable hashes for equivalent inputs', () => {
    const first = hash({ a: 1, b: 2 });
    const second = hash({ b: 2, a: 1 });

    expect(first).toBe(second);
    expect(first).toBe(stableObjectHash);
  });
});
