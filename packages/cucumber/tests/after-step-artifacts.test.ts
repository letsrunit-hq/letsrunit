import { mkdtemp, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { captureAfterStepArtifacts } from '../src/after-step-artifacts';
import { clearConfiguredStoreDirectory, setConfiguredRunId, setConfiguredStoreDirectory } from '../src/store-config';
import { logUnexpectedError } from '../src/unexpected-error-log';

describe('unexpected error logging', () => {
  afterEach(() => {
    clearConfiguredStoreDirectory();
  });

  it('writes {run_id}.errors.log in configured letsrunitStore directory', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'letsrunit-cucumber-errors-'));
    setConfiguredStoreDirectory(dir);
    setConfiguredRunId('run-abc');

    await logUnexpectedError('cucumber.after_step.capture.scrub_html', new Error('scrub failed'), { url: '/transfer' });

    const path = join(dir, 'run-abc.errors.log');
    const content = await readFile(path, 'utf8');

    expect(content).toContain('source: cucumber.after_step.capture.scrub_html');
    expect(content).toContain('url: /transfer');
    expect(content).toContain('error:');
    expect(content).toContain('scrub failed');
  });
});

describe('captureAfterStepArtifacts', () => {
  afterEach(() => {
    clearConfiguredStoreDirectory();
  });

  it('logs scrub errors and still attaches url and screenshot', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'letsrunit-cucumber-artifacts-'));
    setConfiguredStoreDirectory(dir);
    setConfiguredRunId('run-scrub-fail');

    const attach = vi.fn(async () => {});
    const page = {
      url: () => 'https://example.com/transfer',
      screenshot: vi.fn().mockResolvedValue(Buffer.from('png')),
    };

    const failingScrub = vi.fn(async () => {
      throw new Error('scrub exploded');
    });

    await captureAfterStepArtifacts({ page: page as any, attach }, { scrubHtmlFn: failingScrub as any });

    expect(attach).toHaveBeenCalledWith('https://example.com/transfer', 'text/x-letsrunit-url');
    expect(attach).toHaveBeenCalledWith(Buffer.from('png'), 'image/png');
    expect(attach).not.toHaveBeenCalledWith(expect.any(String), 'text/html');

    const logPath = join(dir, 'run-scrub-fail.errors.log');
    const content = await readFile(logPath, 'utf8');
    expect(content).toContain('source: cucumber.after_step.capture.scrub_html');
    expect(content).toContain('scrub exploded');
  });

  it('does not create an error log when no unexpected errors occur', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'letsrunit-cucumber-clean-run-'));
    setConfiguredStoreDirectory(dir);
    setConfiguredRunId('run-no-errors');

    const attach = vi.fn(async () => {});
    const page = {
      url: () => 'https://example.com/ok',
      screenshot: vi.fn().mockResolvedValue(Buffer.from('png')),
    };
    const successfulScrub = vi.fn(async () => '<main>ok</main>');

    await captureAfterStepArtifacts({ page: page as any, attach }, { scrubHtmlFn: successfulScrub as any });

    expect(attach).toHaveBeenCalledWith('https://example.com/ok', 'text/x-letsrunit-url');
    expect(attach).toHaveBeenCalledWith(Buffer.from('png'), 'image/png');
    expect(attach).toHaveBeenCalledWith('<main>ok</main>', 'text/html');
    expect(existsSync(join(dir, 'run-no-errors.errors.log'))).toBe(false);
  });
});
