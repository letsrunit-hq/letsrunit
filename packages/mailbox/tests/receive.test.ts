import { afterEach, describe, expect, it, vi } from 'vitest';

describe('receiveMail dispatcher', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unmock('../src/constants');
    vi.unmock('../src/mailhog/receive');
    vi.unmock('../src/mailpit/receive');
    vi.unmock('../src/testmail/receive');
  });

  it('routes to testmail when MAILBOX_SERVICE=testmail', async () => {
    const mocked = vi.fn().mockResolvedValue([{ subject: 't' }]);
    vi.doMock('../src/constants', () => ({ MAILBOX_SERVICE: 'testmail' }));
    vi.doMock('../src/testmail/receive', () => ({ receiveMail: mocked }));
    vi.doMock('../src/mailhog/receive', () => ({ receiveMail: vi.fn() }));
    vi.doMock('../src/mailpit/receive', () => ({ receiveMail: vi.fn() }));

    const { receiveMail } = await import('../src/receive');
    const res = await receiveMail('u@example.com', { wait: true });

    expect(mocked).toHaveBeenCalledWith('u@example.com', { wait: true });
    expect(res).toEqual([{ subject: 't' }]);
  });

  it('routes to mailhog when MAILBOX_SERVICE=mailhog', async () => {
    const mocked = vi.fn().mockResolvedValue([{ subject: 'h' }]);
    vi.doMock('../src/constants', () => ({ MAILBOX_SERVICE: 'mailhog' }));
    vi.doMock('../src/testmail/receive', () => ({ receiveMail: vi.fn() }));
    vi.doMock('../src/mailhog/receive', () => ({ receiveMail: mocked }));
    vi.doMock('../src/mailpit/receive', () => ({ receiveMail: vi.fn() }));

    const { receiveMail } = await import('../src/receive');
    const res = await receiveMail('u@example.com');

    expect(mocked).toHaveBeenCalledWith('u@example.com', {});
    expect(res).toEqual([{ subject: 'h' }]);
  });

  it('routes to mailpit when MAILBOX_SERVICE=mailpit', async () => {
    const mocked = vi.fn().mockResolvedValue([{ subject: 'p' }]);
    vi.doMock('../src/constants', () => ({ MAILBOX_SERVICE: 'mailpit' }));
    vi.doMock('../src/testmail/receive', () => ({ receiveMail: vi.fn() }));
    vi.doMock('../src/mailhog/receive', () => ({ receiveMail: vi.fn() }));
    vi.doMock('../src/mailpit/receive', () => ({ receiveMail: mocked }));

    const { receiveMail } = await import('../src/receive');
    const res = await receiveMail('u@example.com');

    expect(mocked).toHaveBeenCalledWith('u@example.com', {});
    expect(res).toEqual([{ subject: 'p' }]);
  });

  it('throws for unsupported service', async () => {
    vi.doMock('../src/constants', () => ({ MAILBOX_SERVICE: 'unknown' }));
    vi.doMock('../src/testmail/receive', () => ({ receiveMail: vi.fn() }));
    vi.doMock('../src/mailhog/receive', () => ({ receiveMail: vi.fn() }));
    vi.doMock('../src/mailpit/receive', () => ({ receiveMail: vi.fn() }));

    const { receiveMail } = await import('../src/receive');
    await expect(receiveMail('u@example.com')).rejects.toThrow('Unsupported mailbox service unknown');
  });
});
