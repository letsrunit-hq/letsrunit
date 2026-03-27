import { beforeEach, describe, expect, it, vi } from 'vitest';
import { collectSupportDiagnostics } from '../../src/utility/support';
import { registerDiagnostics } from '../../src/tools/diagnostics';
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
    moduleResolution: {
      serverBddPath: '/tmp/mcp/node_modules/@letsrunit/bdd/dist/index.js',
      projectBddPath: '/tmp/project/node_modules/@letsrunit/bdd/dist/index.js',
      sameModule: false,
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

  beforeEach(() => {
    vi.clearAllMocks();

    let handler: (input: any) => Promise<any>;
    const server = {
      registerTool: (_name: string, _schema: any, h: typeof handler) => {
        handler = h;
      },
    } as any;

    registerDiagnostics(server);
    call = (input: any) => handler(input);
  });

  it('returns support diagnostics payload', async () => {
    const result = parseResult(await call({}));
    expect(result.projectRoot).toBe('/tmp/project');
    expect(result.cucumberConfigPath).toBe('/tmp/project/cucumber.js');
    expect(result.supportEntries).toEqual([
      { kind: 'path', value: '/tmp/project/features/support/steps.ts' },
    ]);
    expect(result.moduleResolution.sameModule).toBe(false);
    expect(result.registry.total).toBe(1);
    expect(result.registry.byType.Given).toBe(1);
    expect(collectSupportDiagnostics).toHaveBeenCalledTimes(1);
  });

  it('returns error payload when diagnostics collection fails', async () => {
    vi.mocked(collectSupportDiagnostics).mockRejectedValueOnce(new Error('diagnostics boom'));

    const result = await call({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('diagnostics boom');
  });
});
