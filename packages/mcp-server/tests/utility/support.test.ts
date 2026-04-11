import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { collectDiagnostics } from '../../src/utility/diagnostics';
import { loadSupportFiles } from '../../src/utility/support';

describe('loadSupportFiles', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

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

  it('resolves diagnostics cwd from LETSRUNIT_PROJECT_CWD', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'letsrunit-mcp-diagnostics-'));
    await writeFile(
      join(cwd, 'cucumber.mjs'),
      `export default {
  import: ['features/support/*.mjs'],
  require: [],
};`,
      'utf8',
    );
    vi.stubEnv('LETSRUNIT_PROJECT_CWD', cwd);

    const diagnostics = await collectDiagnostics();
    expect(diagnostics.envProjectCwd).toBe(cwd);
    expect(diagnostics.effectiveCwd).toBe(cwd);
    expect(diagnostics.projectRoot).toBe(cwd);
    expect(diagnostics.cucumberConfigPath).toBe(join(cwd, 'cucumber.mjs'));
    expect(diagnostics.mcpServer).toBeDefined();
    expect(Object.keys(diagnostics.mcpServer).sort()).toEqual([
      'executablePath',
      'handoffDecision',
      'projectMcpPath',
      'projectServerUsed',
      'serverMcpPath',
      'version',
    ]);
    expect(diagnostics.letsrunitEnv).toBeDefined();
    expect(diagnostics.moduleResolution).toBeDefined();
    expect(Object.keys(diagnostics.moduleResolution).sort()).toEqual([
      'projectBddPath',
      'serverBddPath',
    ]);
    expect(diagnostics.registry).toBeDefined();
    expect(Object.keys(diagnostics.registry.byType).sort()).toEqual(['Given', 'Then', 'When']);
  });
});
