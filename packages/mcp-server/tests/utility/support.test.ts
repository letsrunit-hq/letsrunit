import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { loadSupportFiles } from '../../src/utility/support';

describe('loadSupportFiles', () => {
  it('loads import/require support files and respects letsrunit.ignore', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'letsrunit-mcp-support-'));
    const supportDir = join(cwd, 'features', 'support');
    await mkdir(supportDir, { recursive: true });

    await writeFile(
      join(cwd, 'cucumber.mjs'),
      `export default {
  import: ['features/support/*.mjs'],
  require: [],
  letsrunit: { ignore: ['features/support/world.mjs'] },
};`,
      'utf8',
    );

    await writeFile(
      join(supportDir, 'steps.mjs'),
      'globalThis.__mcpSupportSteps = (globalThis.__mcpSupportSteps ?? 0) + 1;',
      'utf8',
    );
    await writeFile(
      join(supportDir, 'world.mjs'),
      'globalThis.__mcpSupportWorld = (globalThis.__mcpSupportWorld ?? 0) + 1;',
      'utf8',
    );

    (globalThis as any).__mcpSupportSteps = 0;
    (globalThis as any).__mcpSupportWorld = 0;

    await loadSupportFiles(cwd);

    expect((globalThis as any).__mcpSupportSteps).toBe(1);
    expect((globalThis as any).__mcpSupportWorld).toBe(0);
  });
});
