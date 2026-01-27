import stringify from 'fast-json-stable-stringify';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { hash, hashKey } from '../src';

const helloSha256 = '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824';

const stableObject = { b: 2, a: 1 } as const;
const stableObjectHash = createHash('sha256').update(stringify(stableObject)).digest('hex');

describe('hash', () => {
  it('hashes string inputs directly', async () => {
    expect(await hash('hello')).toBe(helloSha256);
  });

  it('stringifies plain objects using fast-json-stable-stringify', async () => {
    expect(await hash(stableObject)).toBe(stableObjectHash);
  });

  it('accepts Uint8Array inputs without stringification', async () => {
    const payload = new Uint8Array([1, 2, 3]);
    const expected = createHash('sha256').update(payload).digest('hex');

    expect(await hash(payload)).toBe(expected);
  });

  it('produces stable hashes for equivalent inputs', async () => {
    const first = await hash({ a: 1, b: 2 });
    const second = await hash({ b: 2, a: 1 });

    expect(first).toBe(second);
    expect(first).toBe(stableObjectHash);
  });
});

describe('hashKey', () => {
  it('replaces {hash} in template with input hash', async () => {
    const template = 'cache:{hash}';
    const input = 'hello';
    const expected = `cache:${helloSha256}`;

    expect(await hashKey(template, input)).toBe(expected);
  });

  it('works with object inputs', async () => {
    const template = 'key-{hash}';
    const expected = `key-${stableObjectHash}`;

    expect(await hashKey(template, stableObject)).toBe(expected);
  });
});
