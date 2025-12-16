import { fixedUUID, uuidToTag } from '@letsrunit/utils';
import { describe, expect, it } from 'vitest';
import { getMailbox } from '../src';
import { MAILBOX_DOMAIN, TESTMAIL_DOMAIN, TESTMAIL_NAMESPACE } from '../src/constants';

const SEED = fixedUUID('mailbox');
const TAG = uuidToTag(SEED);

describe('getMailbox', () => {
  it('uses default mailbox domain', () => {
    const email = getMailbox(SEED);
    expect(email).toBe(`${TAG}@${MAILBOX_DOMAIN}`);
  });

  it('includes the provided name in the local part', () => {
    const email = getMailbox(SEED, 'alpha');
    expect(email).toBe(`${TAG}.alpha@${MAILBOX_DOMAIN}`);
  });

  it('adds namespace for testmail domain', () => {
    const email = getMailbox(SEED, 'beta', TESTMAIL_DOMAIN);
    expect(email).toBe(`${TESTMAIL_NAMESPACE}.${TAG}.beta@${TESTMAIL_DOMAIN}`);
  });

  it('does not add testmail namespace for non-testmail domains', () => {
    const domain = 'test.example.com';
    const email = getMailbox(SEED, 'gamma', domain);
    expect(email).toBe(`${TAG}.gamma@${domain}`);
  });

  it('works without name and with a custom domain', () => {
    const domain = 'custom.example.com';
    const email = getMailbox(SEED, undefined, domain);
    expect(email).toBe(`${TAG}@${domain}`);
  });
});
