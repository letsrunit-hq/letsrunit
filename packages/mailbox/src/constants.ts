const testValue = (value: string) => process.env.NODE_ENV === 'test' ? value : null;

export const MAILBOX_DOMAIN = process.env.MAILBOX_DOMAIN || 'example.com';

export const TESTMAIL_DOMAIN = 'inbox.testmail.app';
export const TESTMAIL_API_KEY = process.env.TESTMAIL_API_KEY || testValue('test_key');
export const TESTMAIL_NAMESPACE = process.env.TESTMAIL_NAMESPACE || testValue('test_ns');

export const MAILHOG_DOMAIN = 'example.com';
export const MAILHOG_BASE_URL = process.env.MAILHOG_BASE_URL || 'http://localhost:8025';
