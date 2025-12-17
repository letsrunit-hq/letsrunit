import { sleep } from '@letsrunit/utils';
import { MAILHOG_BASE_URL } from '../constants';
import type { Email, ReceiveOptions } from '../types';

async function fetchOnce(emailAddress: string, signal: AbortSignal): Promise<any[]> {
  const url = `${MAILHOG_BASE_URL.replace(/\/$/, '')}/api/v2/search?kind=to&query=${encodeURIComponent(emailAddress)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch response from mailhog: ${res.status} ${text}`);
  }
  const body = await res.json();
  return body?.items ?? body?.Items ?? [];
}

function getHeaderValue(headers: Record<string, string[] | string> | undefined, name: string): string | undefined {
  if (!headers) return undefined;
  const v = headers[name] ?? headers[name.toLowerCase() as keyof typeof headers];
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function mapItemsToEmails(items: any[]): Email[] {
  return items.map((item) => {
    // timestamp
    const created = item.Created || item.created || item.Time;
    const timestamp = typeof created === 'number' ? created : Date.parse(created);

    // headers
    const headers: Record<string, string[] | string> | undefined = item.Content?.Headers || item.Content?.headers;

    // bodies from parts
    const parts: any[] = item.MIME?.Parts || item.MIME?.parts || [];
    const htmlPart = parts.find((p) => (p.ContentType || p.contentType || '').startsWith('text/html'));
    const textPart = parts.find((p) => (p.ContentType || p.contentType || '').startsWith('text/plain'));

    const html = htmlPart?.Body || htmlPart?.body || undefined;
    const text = (textPart?.Body || textPart?.body || item.Content?.Body || item.Content?.body || '').toString();

    // basic fields
    const subject = getHeaderValue(headers, 'Subject') || '';
    const from = getHeaderValue(headers, 'From') || '';
    const to = getHeaderValue(headers, 'To') || '';
    const cc = getHeaderValue(headers, 'Cc') || undefined;

    // attachments
    const attachments = parts
      .filter((p) => {
        const ct = (p.ContentType || p.contentType || '').toString();
        const filename = p.FileName || p.Filename || p.filename;
        if (filename) return true;
        return ct && !ct.startsWith('text/');
      })
      .map((p) => ({
        filename: p.FileName || p.Filename || p.filename || 'attachment',
        contentType: p.ContentType || p.contentType || 'application/octet-stream',
      }));

    const email: Email = {
      timestamp,
      from,
      to,
      cc,
      subject,
      html,
      text,
      attachments: attachments.length ? attachments : undefined,
    };

    return email;
  });
}

export async function receiveMail(emailAddress: string, options: ReceiveOptions = {}): Promise<Email[]> {
  const deadline = Date.now() + (options.timeout || (options.wait ? 120_000 : 5_000));
  const pollInterval = 1_000;
  const signal: AbortSignal = options.signal ?? AbortSignal.timeout(Math.max(0, deadline - Date.now()));

  while (!signal.aborted) {
    try {
      const items = await fetchOnce(emailAddress, signal);
      let emails = mapItemsToEmails(items);

      if (options.after) emails = emails.filter((e) => e.timestamp > options.after!);
      if (options.subject) emails = emails.filter((e) => e.subject.includes(options.subject!));
      if (options.limit && options.limit > 0) emails = emails.slice(0, options.limit);

      if (emails.length > 0) {
        return emails;
      }
    } catch (e) {
      // bubble up fetch errors except when aborted due to signal; then just end loop
      if (!signal.aborted) throw e;
    }

    if (!options.wait) break;
    await sleep(pollInterval, { signal });
  }

  return [];
}
