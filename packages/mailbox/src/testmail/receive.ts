import { clean, pick } from '@letsrunit/utils';
import { gql, GraphQLClient } from 'graphql-request';
import { TESTMAIL_API_KEY, TESTMAIL_GRAPHQL_URL } from '../constants';
import type { Email, ReceiveOptions } from '../types';

export async function receive(emailAddress: string, options: ReceiveOptions = {}): Promise<Email[]> {
  if (!TESTMAIL_API_KEY) throw new Error('TESTMAIL_API_KEY environment var not set');

  const match = emailAddress.match(/^(?<namespace>[^.@]+)\.(?<tag>[^@]+)@/);
  if (!match) throw new Error('Email address is not a valid testmail address');

  const namespace = match.groups!.namespace;
  const tag = match.groups!.tag;

  const signal = options.signal ?? AbortSignal.timeout(options.timeout || (options.wait ? 120_000 : 5000));

  const client = new GraphQLClient(TESTMAIL_GRAPHQL_URL, {
    headers: { apikey: TESTMAIL_API_KEY },
    fetch: (input, init = {}) => {
      return fetch(input as RequestInfo, { ...init, signal });
    },
  });

  const query = gql`
    query Inbox($namespace: String!, $tag: String!, $timestampFrom: Long, $subject: String) {
      inbox(
        namespace: $namespace
        tag: $tagPrefix
        ${options.wait ? 'livequery: true' : ''}
        ${options.after ? 'timestamp_from: $timestampFrom' : ''}
        ${options.subject ? `advanced_filters: [{ field: subject, match: exact, action: include, value: $subject }]` : ''}
        advanced_sorts: [{ field: timestamp, order: desc }]
      ) {
        emails {
          timestamp
          from
          to
          cc
          subject
          html
          text
          attachments { filename contentType }
        }
      }
    }
  `;

  const variables: Record<string, any> = clean({
    namespace,
    tag,
    timestampFrom: options.after ?? 0,
    subject: options.subject || '',
  });

  try {
    const data: any = await client.request(query, variables);
    const emails = data?.inbox?.emails || [];
    return emails.map((email: any) => ({
      ...pick(email, ['timestamp', 'from', 'to', 'cc', 'subject', 'html', 'text']),
      attachments: email.attachments?.map((attachment: any) => pick(attachment, ['filename', 'contentType'])),
    }));
  } catch (err: any) {
    const message = err?.response?.errors?.[0]?.message || err?.message || 'Unknown error';
    throw new Error(`Failed to fetch response from testmail: ${message}`);
  }
}
