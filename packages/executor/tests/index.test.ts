import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('executor entrypoints', () => {
  it('keeps explain out of the main executor barrel', () => {
    const source = readFileSync(join(import.meta.dirname, '..', 'src', 'index.ts'), 'utf-8');
    expect(source).not.toContain("./explain");
  });
});
