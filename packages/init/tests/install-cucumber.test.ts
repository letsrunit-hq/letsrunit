import { describe, expect, it, vi } from 'vitest';

const execPm = vi.fn();

vi.mock('../src/detect.js', () => ({
  execPm,
}));

describe('installCucumber', () => {
  it('installs a cucumber version compatible with @letsrunit/cucumber', async () => {
    const { installCucumber } = await import('../src/setup/cucumber.js');

    installCucumber({ cwd: '/tmp/project', packageManager: 'npm' });

    expect(execPm).toHaveBeenCalledWith(
      { cwd: '/tmp/project', packageManager: 'npm' },
      {
        npm: 'install --save-dev @cucumber/cucumber@^12.7.0',
        yarn: 'add --dev @cucumber/cucumber@^12.7.0',
        pnpm: 'add -D @cucumber/cucumber@^12.7.0',
        bun: 'add -d @cucumber/cucumber@^12.7.0',
      },
    );
  });
});
