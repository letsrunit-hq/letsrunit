import { clean, uuidToTag } from '@letsrunit/utils';
import type { UUID } from 'node:crypto';

const TESTMAIL_API_KEY = process.env.TESTMAIL_API_KEY;
const TESTMAIL_NAMESPACE = process.env.TESTMAIL_NAMESPACE;

export function getTestmailAccount(seed: UUID, name?: string) {
  if (!TESTMAIL_NAMESPACE) throw new Error('TESTMAIL_NAMESPACE environment var required');

  const local = clean([TESTMAIL_NAMESPACE, uuidToTag(seed), name]).join('.');

  return `${local}@inbox.testmail.app`;
}
