import { describe, expect, it } from 'vitest';
import { decideHandoff } from '../src/bootstrap';

describe('decideHandoff', () => {
  it('uses standalone mode when project mcp server is not available', () => {
    const result = decideHandoff('/npx/@letsrunit/mcp-server/package.json', null, false);
    expect(result).toEqual({ shouldHandoff: false, runtimeMode: 'standalone' });
  });

  it('uses project mode without handoff when already running project-local server', () => {
    const result = decideHandoff(
      '/repo/node_modules/@letsrunit/mcp-server/package.json',
      '/repo/node_modules/@letsrunit/mcp-server/package.json',
      false,
    );
    expect(result).toEqual({ shouldHandoff: false, runtimeMode: 'project' });
  });

  it('hands off to project-local server when available and different from current package', () => {
    const result = decideHandoff(
      '/npx-cache/@letsrunit/mcp-server/package.json',
      '/repo/node_modules/@letsrunit/mcp-server/package.json',
      false,
    );
    expect(result).toEqual({ shouldHandoff: true, runtimeMode: 'project' });
  });

  it('does not handoff when bootstrap guard is set', () => {
    const result = decideHandoff(
      '/npx-cache/@letsrunit/mcp-server/package.json',
      '/repo/node_modules/@letsrunit/mcp-server/package.json',
      true,
    );
    expect(result).toEqual({ shouldHandoff: false, runtimeMode: 'standalone' });
  });
});
