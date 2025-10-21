import { describe, expect, it } from 'vitest';

import { hash } from '../../src/utils/hash';

describe('hash', () => {
  it('creates the expected sha256 hash for a string', () => {
    expect(hash('letsrunit')).toBe(
      '0524dfe1cecbcb7b55ca6226cba336e846ce59d43a32a740db3492a8f7003832',
    );
  });

  it('produces a consistent 64-character hash for identical input', () => {
    const firstResult = hash('deterministic');
    const secondResult = hash('deterministic');

    expect(firstResult).toHaveLength(64);
    expect(secondResult).toBe(firstResult);
  });
});
