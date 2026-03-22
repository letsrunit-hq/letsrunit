import { afterEach, describe, expect, it, vi } from 'vitest';

async function importFreshConstants() {
  vi.resetModules();
  return await import('../src/constants');
}

describe('constants', () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
    vi.resetModules();
  });

  it('uses test fallback values when NODE_ENV=test and env vars are unset', async () => {
    delete process.env.TESTMAIL_API_KEY;
    delete process.env.TESTMAIL_NAMESPACE;
    delete process.env.MAILBOX_SERVICE;
    delete process.env.MAILBOX_DOMAIN;
    process.env.NODE_ENV = 'test';

    const c = await importFreshConstants();
    expect(c.TESTMAIL_API_KEY).toBe('test_key');
    expect(c.TESTMAIL_NAMESPACE).toBe('test_ns');
    expect(c.MAILBOX_SERVICE).toBe('mailpit');
    expect(c.MAILBOX_DOMAIN).toBe('example.com');
  });

  it('prefers explicit env vars and computes mailbox domain for testmail service', async () => {
    process.env.NODE_ENV = 'production';
    process.env.TESTMAIL_API_KEY = 'k';
    process.env.TESTMAIL_NAMESPACE = 'ns';
    process.env.MAILBOX_SERVICE = 'testmail';
    delete process.env.MAILBOX_DOMAIN;

    const c = await importFreshConstants();
    expect(c.TESTMAIL_API_KEY).toBe('k');
    expect(c.TESTMAIL_NAMESPACE).toBe('ns');
    expect(c.MAILBOX_SERVICE).toBe('testmail');
    expect(c.MAILBOX_DOMAIN).toBe(c.TESTMAIL_DOMAIN);
  });

  it('uses explicit mailbox domain override when provided', async () => {
    process.env.MAILBOX_SERVICE = 'mailhog';
    process.env.MAILBOX_DOMAIN = 'mail.custom.local';

    const c = await importFreshConstants();
    expect(c.MAILBOX_DOMAIN).toBe('mail.custom.local');
  });
});
