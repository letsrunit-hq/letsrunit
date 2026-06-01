import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { bootstrapProjectServer, decideHandoff, resolveRuntimeModeOverride } from '../src/bootstrap';

const dirs: string[] = [];

describe('decideHandoff', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it('uses standalone mode when project mcp server is not available', () => {
    const result = decideHandoff('/npx/@letsrunit/mcp-server/package.json', null, null);
    expect(result).toEqual({ shouldHandoff: false, runtimeMode: 'standalone' });
  });

  it('uses project mode without handoff when already running project-local server', () => {
    const result = decideHandoff(
      '/repo/node_modules/@letsrunit/mcp-server/package.json',
      '/repo/node_modules/@letsrunit/mcp-server/package.json',
      null,
    );
    expect(result).toEqual({ shouldHandoff: false, runtimeMode: 'project' });
  });

  it('uses project mode without handoff when current executable matches project entrypoint', () => {
    const result = decideHandoff(
      '/repo/packages/mcp-server/src/index.ts',
      '/repo/packages/mcp-server/src/index.ts',
      null,
    );
    expect(result).toEqual({ shouldHandoff: false, runtimeMode: 'project' });
  });

  it('hands off to project-local server when available and different from current package', () => {
    const result = decideHandoff(
      '/npx-cache/@letsrunit/mcp-server/package.json',
      '/repo/node_modules/@letsrunit/mcp-server/package.json',
      null,
    );
    expect(result).toEqual({ shouldHandoff: true, runtimeMode: 'project' });
  });

  it('uses runtime override without handoff', () => {
    const result = decideHandoff(
      '/npx-cache/@letsrunit/mcp-server/package.json',
      '/repo/node_modules/@letsrunit/mcp-server/package.json',
      'project',
    );
    expect(result).toEqual({ shouldHandoff: false, runtimeMode: 'project' });
  });

  it('throws for invalid LETSRUNIT_MCP_RUNTIME_MODE', () => {
    vi.stubEnv('LETSRUNIT_MCP_RUNTIME_MODE', 'bad-value');
    expect(() => resolveRuntimeModeOverride()).toThrow(
      'Invalid LETSRUNIT_MCP_RUNTIME_MODE: bad-value. Expected "project" or "standalone".',
    );
  });

  it('loads .letsrunit/.env before resolving project runtime settings', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'letsrunit-mcp-bootstrap-'));
    dirs.push(cwd);
    mkdirSync(join(cwd, '.letsrunit'));
    writeFileSync(
      join(cwd, '.letsrunit', '.env'),
      ['LETSRUNIT_MCP_RUNTIME_MODE=standalone', 'LETSRUNIT_MAILBOX_SERVICE=testmail'].join('\n'),
      'utf-8',
    );
    vi.stubEnv('LETSRUNIT_PROJECT_CWD', cwd);

    expect(bootstrapProjectServer()).toBe('standalone');
    expect(process.env.LETSRUNIT_MAILBOX_SERVICE).toBe('testmail');
  });
});
