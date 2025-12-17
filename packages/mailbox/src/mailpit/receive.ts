import { sleep } from '@letsrunit/utils';
import { MAILPIT_BASE_URL } from '../constants';
import type { Email, ReceiveOptions } from '../types';

function buildSearchQuery(emailAddress: string, options: ReceiveOptions): string {
  const terms: string[] = [`to:${emailAddress}`];
  if (options.subject) {
    const escaped = options.subject.replace(/"/g, '\\"');
    terms.push(`subject:"${escaped}"`);
  }
  if (options.after) {
    const iso = new Date(options.after).toISOString();
    terms.push(`after:${iso}`);
  }
  return terms.join(' ');
}

async function search(emailAddress: string, options: ReceiveOptions, signal: AbortSignal): Promise<any[]> {
  const base = MAILPIT_BASE_URL.replace(/\/$/, '');
  const query = buildSearchQuery(emailAddress, options);
  const limitParam = options.limit && options.limit > 0 ? `&limit=${encodeURIComponent(String(options.limit))}` : '';
  const url = `${base}/api/v1/search?query=${encodeURIComponent(query)}${limitParam}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch response from mailpit: ${res.status} ${text}`);
  }
  const body = await res.json();
  return body?.messages ?? [];
}

async function fetchFullMessage(
  id: string,
  signal: AbortSignal,
): Promise<{
  Html?: string;
  Text?: string;
  Attachments?: any[];
  Created?: string | number;
  Subject?: string;
  From?: any;
  To?: any[];
  Cc?: any[];
} | null> {
  const base = MAILPIT_BASE_URL.replace(/\/$/, '');
  const url = `${base}/api/v1/message/${encodeURIComponent(id)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function pickAddress(obj: any): string {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  const name = obj.Name;
  const addr = obj.Address || '';
  return name ? `${name} <${addr}>` : addr;
}

function joinAddresses(list?: any[]): string {
  if (!Array.isArray(list) || list.length === 0) return '';
  return list.map(pickAddress).filter(Boolean).join(', ');
}

function mapMessageToEmail(m: any): Email {
  const attachments = Array.isArray(m.Attachments)
    ? m.Attachments.map((a: any) => ({
        filename: a.FileName,
        contentType: a.ContentType,
      }))
    : undefined;

  return {
    timestamp: Date.parse(m.Created ?? m.Date),
    from: pickAddress(m.From),
    to: joinAddresses(m.To),
    cc: m.Cc && joinAddresses(m.Cc),
    subject: m.Subject,
    html: m.HTML,
    text: m.Text,
    attachments,
  };
}

async function fetchFullEmails(messages: any[], signal: AbortSignal): Promise<Email[]> {
  const ids: string[] = messages.map((m: any) => m.ID).filter(Boolean);
  const details = await Promise.all(ids.map((id) => fetchFullMessage(id, signal)));
  return details.filter(Boolean).map((d) => mapMessageToEmail(d));
}

export async function receiveMail(emailAddress: string, options: ReceiveOptions = {}): Promise<Email[]> {
  const pollInterval = 1_000;
  const timeout = options.timeout || (options.wait ? 60_000 : 5_000);
  const signal: AbortSignal = options.signal ?? AbortSignal.timeout(timeout);

  while (!signal.aborted) {
    try {
      const messages = await search(emailAddress, options, signal);
      const emails = options.full
        ? await fetchFullEmails(messages, signal)
        : messages.map((m) => mapMessageToEmail(m));

      if (emails.length > 0) {
        return emails;
      }
    } catch (e) {
      if (!signal.aborted) throw e;
    }

    if (!options.wait) break;
    await sleep(pollInterval, { signal });
  }

  return [];
}
