import { clean, uuidToTag } from '@letsrunit/utils';
import type { UUID } from 'node:crypto';
import { MAILBOX_DOMAIN, TESTMAIL_DOMAIN, TESTMAIL_NAMESPACE } from './constants';

export function getMailbox(seed: UUID, name?: string, domain?: string) {
  domain ??= MAILBOX_DOMAIN;

  const ns = domain === TESTMAIL_DOMAIN ? TESTMAIL_NAMESPACE : null;
  const local = clean([ns, uuidToTag(seed), name]).join('.');

  return `${local}@${domain}`;
}
