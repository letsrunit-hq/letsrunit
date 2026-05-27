const testValue = (value: string) => (process.env.NODE_ENV === 'test' ? value : null);

export const TESTMAIL_DOMAIN = 'inbox.testmail.app';
export const TESTMAIL_API_KEY = process.env.LETSRUNIT_TESTMAIL_API_KEY || testValue('test_key');
export const TESTMAIL_NAMESPACE = process.env.LETSRUNIT_TESTMAIL_NAMESPACE || testValue('test_ns');
export const TESTMAIL_GRAPHQL_URL = 'https://api.testmail.app/api/graphql';

export const MAILHOG_BASE_URL = process.env.LETSRUNIT_MAILHOG_BASE_URL || 'http://localhost:8025';

export const MAILPIT_BASE_URL = process.env.LETSRUNIT_MAILPIT_BASE_URL || 'http://localhost:8025';

export const MAILBOX_SERVICE = process.env.LETSRUNIT_MAILBOX_SERVICE || 'mailpit';
export const MAILBOX_DOMAIN =
  process.env.LETSRUNIT_MAILBOX_DOMAIN || (MAILBOX_SERVICE === 'testmail' ? TESTMAIL_DOMAIN : 'example.com');
