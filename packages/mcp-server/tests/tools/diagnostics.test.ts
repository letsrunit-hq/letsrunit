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
    expect(collectSupportDiagnostics).toHaveBeenCalledTimes(1);
  });

  it('returns error payload when diagnostics collection fails', async () => {
    vi.mocked(collectSupportDiagnostics).mockRejectedValueOnce(new Error('diagnostics boom'));

    const result = await call({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('diagnostics boom');
  });
});
