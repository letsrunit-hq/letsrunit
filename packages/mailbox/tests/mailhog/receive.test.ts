import { afterEach, describe, expect, it, vi } from 'vitest';
import { receiveMail } from '../../src/mailhog/receive';

describe('mailhog.receive', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches messages and maps to Email[]', async () => {
    const email = 'user@example.com';
    const body = {
      total: 1,
      count: 1,
      items: [
        {
          Created: '2025-01-01T00:00:10Z',
          Content: {
            Headers: {
              Subject: ['Welcome'],
              From: ['Sender <sender@example.com>'],
              To: ['user@example.com'],
              Cc: ['cc@example.com'],
            },
            Body: 'Fallback body',
          },
          MIME: {
            Parts: [
              { ContentType: 'text/plain', Body: 'Hello text' },
              { ContentType: 'text/html', Body: '<p>Hello</p>' },
              { ContentType: 'application/pdf', FileName: 'file.pdf', Body: '...' },
            ],
          },
        },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(body) });
    vi.stubGlobal('fetch', fetchMock as any);

    const res = await receiveMail(email);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url: string = fetchMock.mock.calls[0][0];
    expect(url).toBe('http://localhost:8025/api/v2/search?kind=to&query=user%40example.com');

    expect(res).toHaveLength(1);
    const e = res[0];
    expect(e.subject).toBe('Welcome');
    expect(e.from).toContain('sender@example.com');
    expect(e.to).toContain('user@example.com');
    expect(e.cc).toContain('cc@example.com');
    expect(e.html).toBe('<p>Hello</p>');
    expect(e.text).toBe('Hello text');
    expect(e.attachments).toEqual([{ filename: 'file.pdf', contentType: 'application/pdf' }]);
  });

  it('filters by after', async () => {
    const email = 'user@example.com';
    const body = {
      items: [
        { Created: '2025-01-01T00:00:00Z', Content: { Headers: { Subject: ['A'] } } },
        { Created: '2025-01-01T00:00:15Z', Content: { Headers: { Subject: ['B'] } } },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(body) });
    vi.stubGlobal('fetch', fetchMock as any);

    const after = Date.parse('2025-01-01T00:00:10Z');
    const res = await receiveMail(email, { after });
    expect(res.map((e) => e.subject)).toEqual(['B']);
  });

  it('throws on non-ok response', async () => {
    const email = 'user@example.com';
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, text: vi.fn().mockResolvedValue('nope') });
    vi.stubGlobal('fetch', fetchMock as any);

    await expect(receiveMail(email)).rejects.toThrow('Failed to fetch response from mailhog:');
  });

  it('applies limit to result set', async () => {
    const email = 'user@example.com';
    const body = {
      items: [
        { Created: '2025-01-01T00:00:10Z', Content: { Headers: { Subject: ['S1'] } } },
        { Created: '2025-01-01T00:00:11Z', Content: { Headers: { Subject: ['S2'] } } },
        { Created: '2025-01-01T00:00:12Z', Content: { Headers: { Subject: ['S3'] } } },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(body) });
    vi.stubGlobal('fetch', fetchMock as any);

    const res = await receiveMail(email, { limit: 2 });
    expect(res).toHaveLength(2);
    expect(res.map((e) => e.subject)).toEqual(['S1', 'S2']);
  });
});
