import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetRegistryToBuiltInSteps } from '@letsrunit/bdd';
import { registerReload } from '../../src/tools/reload';
import { reloadSupportFiles } from '../../src/utility/support';
import { captureHandler, parseResult } from '../_helpers';

vi.mock('@letsrunit/bdd', () => ({
  resetRegistryToBuiltInSteps: vi.fn(),
}));

vi.mock('../../src/utility/support', () => ({
  reloadSupportFiles: vi.fn(),
}));

describe('registerReload', () => {
  let call: (input: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(reloadSupportFiles).mockResolvedValue({
      projectRoot: '/tmp/project',
      supportEntriesLoaded: 2,
      ignoredEntries: 1,
    });
    call = captureHandler((server) => registerReload(server as any, { runtimeMode: 'project' }), {} as any);
  });

  it('resets registry and reloads support files in project mode', async () => {
    const result = parseResult(await call({}));

    expect(resetRegistryToBuiltInSteps).toHaveBeenCalledTimes(1);
    expect(reloadSupportFiles).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      reloaded: true,
      projectRoot: '/tmp/project',
      supportEntriesLoaded: 2,
      ignoredEntries: 1,
    });
  });

  it('passes cwd to reloadSupportFiles when provided', async () => {
    await call({ cwd: '/repo/app' });
    expect(reloadSupportFiles).toHaveBeenCalledWith('/repo/app');
  });

  it('returns an error outside project mode', async () => {
    const standaloneCall = captureHandler(
      (server) => registerReload(server as any, { runtimeMode: 'standalone' }),
      {} as any,
    );
    const result = await standaloneCall({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('only available in project runtime mode');
    expect(resetRegistryToBuiltInSteps).not.toHaveBeenCalled();
    expect(reloadSupportFiles).not.toHaveBeenCalled();
  });

  it('returns an error when reload fails', async () => {
    vi.mocked(reloadSupportFiles).mockRejectedValueOnce(new Error('reload boom'));

    const result = await call({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('reload boom');
  });
});
