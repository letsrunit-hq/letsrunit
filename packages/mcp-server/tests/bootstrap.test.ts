import { afterEach, describe, expect, it, vi } from 'vitest';
import { decideHandoff, resolveRuntimeModeOverride } from '../src/bootstrap';

describe('decideHandoff', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
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
});
