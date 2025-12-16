import { clean, pick } from '@letsrunit/utils';
import { TESTMAIL_API_KEY } from '../constants';
import type { Email, ReceiveOptions } from '../types';

export async function receive(emailAddress: string, options: ReceiveOptions = {}): Promise<Email[]> {
  if (!TESTMAIL_API_KEY) throw new Error('TESTMAIL_API_KEY environment var not set');

  const match = emailAddress.match(/^(?<namespace>[^.@]+)\.(?<tag>[^@]+)@inbox\.testmail\.app$/);
  if (!match) throw new Error('Email address is not a valid testmail address');

  const query = new URLSearchParams(
    clean({
      apikey: TESTMAIL_API_KEY,
      namespace: match.groups!.namespace,
      tag: match.groups!.tag,
      livequery: options.wait ? 'true' : undefined,
      timestamp_from: options.after ? String(options.after) : undefined,
    }),
  ).toString();

  const timeout = options.timeout || (options.wait ? 120_000 : 5000);

  const response = await fetch(`https://api.testmail.app/api/json?${query}`, { signal: AbortSignal.timeout(timeout) });

  if (!response.ok) {
    const reason = await response.json();
    throw new Error(`Failed to fetch response from testmail: ${reason.message}`);
  }

  const body = await response.json();

  return body.emails.map((email: any) => ({
    ...pick(email, ['timestamp', 'from', 'to', 'cc', 'subject', 'html', 'text']),
    attachments: email.attachments?.map((attachment: any) => pick(attachment, ['filename', 'contentType'])),
  }))
}
