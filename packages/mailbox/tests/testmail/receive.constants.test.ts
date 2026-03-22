import { afterEach, describe, expect, it, vi } from 'vitest';

describe('testmail.receive env and error branches', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.unmock('../../src/constants');
    vi.unmock('graphql-request');
  });

  it('throws when TESTMAIL_API_KEY is missing', async () => {
    vi.doMock('../../src/constants', () => ({
      TESTMAIL_API_KEY: null,
      TESTMAIL_GRAPHQL_URL: 'https://api.testmail.app/api/graphql',
    }));
    vi.doMock('graphql-request', () => ({
      GraphQLClient: class {},
    }));

    const { receiveMail } = await import('../../src/testmail/receive');
    await expect(receiveMail('ns.tag@inbox.testmail.app')).rejects.toThrow(
      'TESTMAIL_API_KEY environment var not set',
    );
  });

  it('throws on invalid testmail address format', async () => {
    vi.doMock('../../src/constants', () => ({
      TESTMAIL_API_KEY: 'key',
      TESTMAIL_GRAPHQL_URL: 'https://api.testmail.app/api/graphql',
    }));
    vi.doMock('graphql-request', () => ({
      GraphQLClient: class {},
    }));

    const { receiveMail } = await import('../../src/testmail/receive');
    await expect(receiveMail('not-a-testmail-address')).rejects.toThrow(
      'Email address is not a valid testmail address',
    );
  });

  it('returns empty list when GraphQL response has no emails', async () => {
    class MockGraphQLClient {
      request = vi.fn().mockResolvedValue({});
      constructor(_endpoint: string, _options?: any) {}
    }
    vi.doMock('../../src/constants', () => ({
      TESTMAIL_API_KEY: 'key',
      TESTMAIL_GRAPHQL_URL: 'https://api.testmail.app/api/graphql',
    }));
    vi.doMock('graphql-request', () => ({
      GraphQLClient: MockGraphQLClient,
    }));

    const { receiveMail } = await import('../../src/testmail/receive');
    const res = await receiveMail('ns.tag@inbox.testmail.app');
    expect(res).toEqual([]);
  });

  it('falls back to unknown error message when GraphQL error has no details', async () => {
    class MockGraphQLClient {
      request = vi.fn().mockRejectedValue({});
      constructor(_endpoint: string, _options?: any) {}
    }
    vi.doMock('../../src/constants', () => ({
      TESTMAIL_API_KEY: 'key',
      TESTMAIL_GRAPHQL_URL: 'https://api.testmail.app/api/graphql',
    }));
    vi.doMock('graphql-request', () => ({
      GraphQLClient: MockGraphQLClient,
    }));

    const { receiveMail } = await import('../../src/testmail/receive');
    await expect(receiveMail('ns.tag@inbox.testmail.app')).rejects.toThrow(
      'Failed to fetch response from testmail: Unknown error',
    );
  });
});
