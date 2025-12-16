import { afterEach, describe, expect, it, vi } from 'vitest';
import { receive } from '../src/testmail/receive';

describe('testmail.receive', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds query and maps response', async () => {
    const email = 'ns.abcd1234@inbox.testmail.app';

    const mockJson = vi.fn().mockResolvedValue({
      emails: [
        {
          timestamp: 1734300000000,
          from: 'Sender <sender@example.com>',
          to: 'ns.abcd1234@inbox.testmail.app',
          cc: 'cc@example.com',
          subject: 'Hello',
          html: '<p>Hi</p>',
          text: 'Hi',
          attachments: [{ filename: 'a.txt', contentType: 'text/plain', size: 10 }],
        },
      ],
    });

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: mockJson });
    vi.stubGlobal('fetch', fetchMock as any);

    const res = await receive(email, { wait: true, after: 1734200000000 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url: string = fetchMock.mock.calls[0][0];
    expect(url.startsWith('https://api.testmail.app/api/json?')).toBe(true);
    const qs = url.split('?')[1] || '';
    const params = new URLSearchParams(qs);
    expect(params.get('apikey')).toBe('test_key');
    expect(params.get('namespace')).toBe('ns');
    expect(params.get('tag')).toBe('abcd1234');
    expect(params.get('livequery')).toBe('true');
    expect(params.get('timestamp_from')).toBe('1734200000000');

    const init = fetchMock.mock.calls[0][1];
    expect(init?.signal).toBeInstanceOf(AbortSignal);

    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({
      timestamp: 1734300000000,
      from: 'Sender <sender@example.com>',
      to: 'ns.abcd1234@inbox.testmail.app',
      cc: 'cc@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
      text: 'Hi',
      attachments: [{ filename: 'a.txt', contentType: 'text/plain' }],
    });
  });

  it('throws on non-ok response with reason', async () => {
    const email = 'ns.tag@inbox.testmail.app';
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, json: vi.fn().mockResolvedValue({ message: 'bad' }) });
    vi.stubGlobal('fetch', fetchMock as any);

    await expect(receive(email)).rejects.toThrow('Failed to fetch response from testmail: bad');
  });
});
