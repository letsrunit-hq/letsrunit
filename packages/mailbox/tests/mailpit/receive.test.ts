import { afterEach, describe, expect, it, vi } from 'vitest';
import { receiveMail } from '../../src/mailpit/receive';

describe('mailpit.receive', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches messages and maps to Email[] (default without bodies)', async () => {
    const email = 'user@mailpit.local';
    const body = {
      total: 1,
      messages: [
        {
          Created: '2025-01-01T00:00:10Z',
          Subject: 'Welcome',
          From: { Address: 'sender@example.com', Name: 'Sender' },
          To: [{ Address: 'user@mailpit.local' }],
          Cc: [{ Address: 'cc@example.com' }],
        },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(body) });
    vi.stubGlobal('fetch', fetchMock as any);

    const res = await receiveMail(email);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url: string = fetchMock.mock.calls[0][0];
    expect(url).toBe('http://localhost:8025/api/v1/search?query=to%3Auser%40mailpit.local');

    expect(res).toHaveLength(1);
    const e = res[0];
    expect(e.subject).toBe('Welcome');
    expect(e.from).toContain('sender@example.com');
    expect(e.to).toContain('user@mailpit.local');
    expect(e.cc).toContain('cc@example.com');
    // default: no bodies
    expect(e.html).toBeUndefined();
    expect(e.text).toBeUndefined();
    expect(e.attachments).toBeUndefined();
  });

  it('includes bodies when options.full = true', async () => {
    const email = 'user@mailpit.local';
    const searchBody = {
      messages: [
        {
          ID: 'abc123',
          Created: '2025-01-01T00:00:10Z',
          Subject: 'Hello',
          From: { Address: 'no-reply@mailpit.local' },
          To: [{ Address: 'user@mailpit.local' }],
        },
      ],
    };
    const detailBody = { HTML: '<p>Hello</p>', Text: 'Hello text' };

    const fetchMock = vi.fn().mockImplementation((input: any) => {
      const u = String(input);
      if (u.includes('/api/v1/search'))
        return Promise.resolve({ ok: true, json: vi.fn().mockResolvedValue(searchBody) });
      if (u.includes('/api/v1/message/abc123'))
        return Promise.resolve({ ok: true, json: vi.fn().mockResolvedValue(detailBody) });
      return Promise.resolve({ ok: false, text: vi.fn().mockResolvedValue('not found') });
    });
    vi.stubGlobal('fetch', fetchMock as any);

    const res = await receiveMail(email, { full: true });
    expect(res).toHaveLength(1);
    expect(res[0].text).toBe('Hello text');
    expect(res[0].html).toBe('<p>Hello</p>');
  });

  it('uses server-side after filter and applies limit', async () => {
    const email = 'user@mailpit.local';
    const body = {
      messages: [
        // assuming server already filtered using `after` and applied limit=1
        { Created: '2025-01-01T00:00:11Z', Subject: 'B' },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(body) });
    vi.stubGlobal('fetch', fetchMock as any);

    const after = Date.parse('2025-01-01T00:00:10Z');
    const res = await receiveMail(email, { after, limit: 1 });
    const url: string = fetchMock.mock.calls[0][0];
    // after should be encoded as ISO
    expect(url).toContain(encodeURIComponent('after:2025-01-01T00:00:10.000Z'));
    // ensure limit param is passed to server
    expect(url).toContain('&limit=1');
    expect(res.map((e) => e.subject)).toEqual(['B']);
  });

  it('throws on non-ok response', async () => {
    const email = 'user@mailpit.local';
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, text: vi.fn().mockResolvedValue('bad') });
    vi.stubGlobal('fetch', fetchMock as any);

    await expect(receiveMail(email)).rejects.toThrow('Failed to fetch response from mailpit:');
  });

  it('adds subject filter (escaped) to search query', async () => {
    const email = 'user@mailpit.local';
    const subject = 'He said "Hello"';
    const body = { messages: [] };

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(body) });
    vi.stubGlobal('fetch', fetchMock as any);

    await receiveMail(email, { subject });
    const url: string = fetchMock.mock.calls[0][0];
    // Ensure subject filter is present and quotes are escaped then URL-encoded
    const expectedTerm = encodeURIComponent('subject:"He said \\"Hello\\""');
    expect(url).toContain(expectedTerm);
  });
});
