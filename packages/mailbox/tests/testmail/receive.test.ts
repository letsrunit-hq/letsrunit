import { afterEach, describe, expect, it, vi } from 'vitest';
import { receiveMail } from '../../src/testmail/receive';

vi.mock('graphql-request', async () => {
  class MockGraphQLClient {
    endpoint: string;
    options: any;
    constructor(endpoint: string, options?: any) {
      this.endpoint = endpoint;
      this.options = options;
    }
    request(_query: any, _variables?: any) {
      // this will be spied/mocked per-test
      return undefined as any;
    }
  }
  // expose gql passthrough and our mock client
  const gql = (strings: TemplateStringsArray, ...values: any[]) => strings.join('');
  return { GraphQLClient: MockGraphQLClient, gql };
});

describe('testmail.receive', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds GQL query and maps response', async () => {
    const email = 'ns.abcd1234@inbox.testmail.app';
    const { GraphQLClient, gql }: any = await import('graphql-request');

    // Arrange response
    const emailsPayload = [
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
    ];

    // Capture instance to set request behavior
    let instance: any;
    const ClientCtor = GraphQLClient as any;
    // intercept constructor usage
    vi.spyOn<any, any>(ClientCtor.prototype, 'request').mockResolvedValue({ inbox: { emails: emailsPayload } });

    const res = await receiveMail(email, { wait: true, after: 1734200000000, subject: 'Hello', full: true });

    // Validate mapping

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

    // Validate client setup and request
    // There is no direct instance export; instead check that our mocked client's request was called with query and variables
    const calls = (ClientCtor.prototype.request as any).mock.calls;
    expect(calls.length).toBe(1);
    const [queryStr, variables] = calls[0];
    expect(typeof queryStr).toBe('string');
    expect(queryStr).toContain('inbox');
    expect(queryStr).toContain('emails');
    expect(queryStr).toContain('timestamp');
    expect(queryStr).toContain('attachments');
    expect(variables).toMatchObject({
      namespace: 'ns',
      tag: 'abcd1234',
      timestampFrom: 1734200000000,
      subject: 'Hello',
    });
  });

  it('throws on GraphQL error with reason', async () => {
    const email = 'ns.tag@inbox.testmail.app';
    const { GraphQLClient }: any = await import('graphql-request');
    const ClientCtor = GraphQLClient as any;
    vi.spyOn<any, any>(ClientCtor.prototype, 'request').mockRejectedValue({ response: { errors: [{ message: 'bad' }] } });

    await expect(receiveMail(email)).rejects.toThrow('Failed to fetch response from testmail: bad');
  });

  it('passes limit to GraphQL and returns limited results', async () => {
    const email = 'ns.tag@inbox.testmail.app';
    const { GraphQLClient }: any = await import('graphql-request');
    const ClientCtor = GraphQLClient as any;
    const payload = {
      inbox: {
        emails: [
          { timestamp: 1, from: 'a', to: 'x', subject: 'S1', text: '1' },
          { timestamp: 2, from: 'b', to: 'x', subject: 'S2', text: '2' },
        ],
      },
    };
    vi.spyOn<any, any>(ClientCtor.prototype, 'request').mockResolvedValue(payload);

    const res = await receiveMail(email, { limit: 2 });
    expect(res).toHaveLength(2);
    expect(res.map((e) => e.subject)).toEqual(['S1', 'S2']);

    // Ensure limit was passed to GraphQL variables
    const calls = (ClientCtor.prototype.request as any).mock.calls;
    expect(calls.length).toBe(1);
    const [_queryStr, variables] = calls[0];
    expect(variables).toMatchObject({ limit: 2 });
  });
});
