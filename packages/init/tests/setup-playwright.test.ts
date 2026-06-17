import { describe, expect, it, vi } from 'vitest';

const execPm = vi.fn();

vi.mock('../src/detect.js', () => ({
  execPm,
}));

describe('installPlaywright', () => {
  it('uses exact-version install flags for every package manager', async () => {
    const { installPlaywright } = await import('../src/setup/playwright.js');

    installPlaywright({ cwd: '/tmp/project', packageManager: 'npm' });

    expect(execPm).toHaveBeenCalledWith(
      { cwd: '/tmp/project', packageManager: 'npm' },
      {
        npm: 'install --save-dev --save-exact @playwright/test@1.61.0',
        yarn: 'add --dev --exact @playwright/test@1.61.0',
        pnpm: 'add -D --save-exact @playwright/test@1.61.0',
        bun: 'add -d --exact @playwright/test@1.61.0',
      },
    );
  });
});
