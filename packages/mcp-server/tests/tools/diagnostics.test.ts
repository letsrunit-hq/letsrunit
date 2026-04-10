import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerDiagnostics } from '../../src/tools';
import { collectSupportDiagnostics } from '../../src/utility/support';
import { parseResult } from '../_helpers';

vi.mock('../../src/utility/support', () => ({
  collectSupportDiagnostics: vi.fn().mockResolvedValue({
    envProjectCwd: '/tmp/project',
    processCwd: '/tmp/process',
    inputCwd: null,
    effectiveCwd: '/tmp/project',
    projectRoot: '/tmp/project',
    cucumberConfigPath: '/tmp/project/cucumber.js',
    supportPatterns: ['features/support/**/*.ts'],
    ignorePatterns: [],
    ignoredPaths: [],
    supportEntries: [{ kind: 'path', value: '/tmp/project/features/support/steps.ts' }],
    loadedProjectRoots: [],
    loadedSupportEntries: [],
    mcpServer: {
      version: '0.14.1',
      executablePath: '/tmp/mcp/dist/index.js',
      projectServerUsed: false,
      handoffDecision: {
        shouldHandoff: false,
        runtimeMode: 'standalone',
      },
      serverMcpPath: '/tmp/mcp/node_modules/@letsrunit/mcp-server/dist/index.js',
      projectMcpPath: '/tmp/project/node_modules/@letsrunit/mcp-server/dist/index.js',
    },
    letsrunitEnv: {
      LETSRUNIT_MCP_DIAGNOSTICS: 'enabled',
    },
    moduleResolution: {
      serverBddPath: '/tmp/mcp/node_modules/@letsrunit/bdd/dist/index.js',
      projectBddPath: '/tmp/project/node_modules/@letsrunit/bdd/dist/index.js',
    },
    registry: {
      total: 1,
      byType: { Given: 1, When: 0, Then: 0 },
      definitions: [{ type: 'Given', source: 'there are example Ownables' }],
    },
  }),
}));

describe('registerDiagnostics', () => {
  let call: (input: any) => Promise<any>;
  const sessions = {
    get: vi.fn().mockReturnValue({
      id: 'sess-abc',
      createdAt: 123,
      lastActivity: 456,
      stepCount: 2,
      artifactDir: '/tmp/artifacts/sess-abc',
      controller: {
        page: {
          url: () => 'http://localhost:3000/',
        },
      },
    }),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();

    let handler: (input: any) => Promise<any>;
    const server = {
      registerTool: (_name: string, _schema: any, h: typeof handler) => {
        handler = h;
      },
    } as any;

    registerDiagnostics(server, sessions);
    call = (input: any) => handler(input);
  });

  it('returns support diagnostics payload', async () => {
    const result = parseResult(await call({ sessionId: 'sess-abc' }));
    expect(result.projectRoot).toBe('/tmp/project');
    expect(result.cucumberConfigPath).toBe('/tmp/project/cucumber.js');
    expect(result.supportEntries).toEqual([{ kind: 'path', value: '/tmp/project/features/support/steps.ts' }]);
    expect(result.mcpServer.runtimeMode).toBeUndefined();
    expect(result.moduleResolution.serverBddPath).toContain('@letsrunit/bdd');
    expect(result.letsrunitEnv.LETSRUNIT_MCP_DIAGNOSTICS).toBe('enabled');
    expect(result.session.sessionId).toBe('sess-abc');
    expect(result.session.pageUrl).toBe('http://localhost:3000/');
    expect(result.registry.total).toBe(1);
    expect(result.registry.byType.Given).toBe(1);
    expect(collectSupportDiagnostics).toHaveBeenCalledTimes(1);
    expect(sessions.get).toHaveBeenCalledWith('sess-abc');
  });

  it('returns error payload when diagnostics collection fails', async () => {
    vi.mocked(collectSupportDiagnostics).mockRejectedValueOnce(new Error('diagnostics boom'));

    const result = await call({ sessionId: 'sess-abc' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('diagnostics boom');
  });
});
