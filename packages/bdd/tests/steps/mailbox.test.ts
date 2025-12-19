import { beforeEach, describe, expect, it, vi } from 'vitest';
import { receive, view } from '../../src/steps/mailbox';
import { runStep } from '../helpers';

vi.mock('@letsrunit/mailbox', () => ({
  receiveMail: vi.fn(async () => []),
  toEml: vi.fn(() => 'eml-data'),
}));

vi.mock('@letsrunit/utils', async (orig) => {
  const actual = await (orig as any)();
  return {
    ...actual,
    asFilename: vi.fn((s: string, ext?: string) => (ext ? `fn-${s}.${ext}` : `fn-${s}`)),
    textToHtml: vi.fn((t: string) => `<p>${t}</p>`),
  };
});

describe('steps/mailbox (definitions)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Given I'm viewing an email: uses html body when present and loads into page", async () => {
    const { receiveMail } = await import('@letsrunit/mailbox');
    (receiveMail as any).mockResolvedValueOnce([{ subject: 'Hello', html: '<h1>Hi</h1>', text: 'Hi' }]);

    const goto = vi.fn(async () => {});
    const setContent = vi.fn(async () => {});
    const page = { goto, setContent } as any;

    const startTime = new Date('2024-01-01T00:00:00Z');
    const world: any = { page, startTime };

    await runStep(view, 'I\'m viewing an email sent to "a@b.test" with subject "Hello"', world);

    expect(receiveMail).toHaveBeenCalledWith('a@b.test', {
      full: true,
      after: startTime,
      subject: 'Hello',
      limit: 1,
    });
    expect(goto).toHaveBeenCalledWith('about:blank', { waitUntil: 'load' });
    expect(setContent).toHaveBeenCalledWith('<h1>Hi</h1>', { waitUntil: 'domcontentloaded' });
  });

  it("Given I'm viewing an email: falls back to text via textToHtml when no html", async () => {
    const { receiveMail } = await import('@letsrunit/mailbox');
    const { textToHtml } = await import('@letsrunit/utils');
    (receiveMail as any).mockResolvedValueOnce([{ subject: 'Ping', text: 'plain' }]);

    const goto = vi.fn(async () => {});
    const setContent = vi.fn(async () => {});
    const page = { goto, setContent } as any;

    const startTime = new Date('2024-02-02T00:00:00Z');
    const world: any = { page, startTime };

    await runStep(view, 'I\'m viewing an email sent to "x@y.test" with subject "Ping"', world);

    expect(receiveMail).toHaveBeenCalledWith('x@y.test', {
      full: true,
      after: startTime,
      subject: 'Ping',
      limit: 1,
    });
    expect(textToHtml as any).toHaveBeenCalledWith('plain');
    expect(setContent).toHaveBeenCalledWith('<p>plain</p>', { waitUntil: 'domcontentloaded' });
  });

  it('Then mailbox received an email: waits with timeout and attaches correct payload for eml', async () => {
    const { receiveMail } = await import('@letsrunit/mailbox');
    const { asFilename } = await import('@letsrunit/utils');
    (receiveMail as any).mockResolvedValueOnce([{ subject: 'Welcome!', html: '<b>w</b>', text: 'w' }]);

    const attach = vi.fn();
    const world: any = { attach, startTime: new Date('2024-03-03T00:00:00Z') };

    await runStep(receive, 'mailbox "box@test" received an email with subject "Welcome!"', world);

    expect(receiveMail).toHaveBeenCalledWith('box@test', {
      after: world.startTime,
      full: true,
      subject: 'Welcome!',
      wait: true,
      timeout: 120_000,
      limit: 1,
    });
    expect(asFilename).toHaveBeenCalledWith('Welcome!', 'eml');
    expect(attach).toHaveBeenCalledWith('eml-data', {
      mediaType: 'message/rfc822',
      fileName: 'fn-Welcome!.eml',
    });
  });

  it('Then mailbox received an email: attaches eml even when no html', async () => {
    const { receiveMail } = await import('@letsrunit/mailbox');
    const { asFilename } = await import('@letsrunit/utils');
    (receiveMail as any).mockResolvedValueOnce([{ subject: 'Plain', text: 'Body' }]);

    const attach = vi.fn();
    const world: any = { attach, startTime: new Date('2024-04-04T00:00:00Z') };

    await runStep(receive, 'mailbox "user@test" received an email with subject "Plain"', world);

    expect(receiveMail).toHaveBeenCalledWith('user@test', {
      after: world.startTime,
      full: true,
      subject: 'Plain',
      wait: true,
      timeout: 120_000,
      limit: 1,
    });
    expect(asFilename).toHaveBeenCalledWith('Plain', 'eml');
    expect(attach).toHaveBeenCalledWith('eml-data', {
      mediaType: 'message/rfc822',
      fileName: 'fn-Plain.eml',
    });
  });
});
