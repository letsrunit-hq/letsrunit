import { MAILHOG_DOMAIN, TESTMAIL_DOMAIN } from './constants';
import { receive as mailhogReceive } from './mailhog/receive';
import { receive as testmailReceive } from './testmail/receive';
import type { Email, ReceiveOptions } from './types';

export async function receive(emailAddress: string, options: ReceiveOptions = {}): Promise<Email[]> {
  const domain = emailAddress.split('@')[1]?.toLowerCase();

  if (domain === TESTMAIL_DOMAIN) {
    return await testmailReceive(emailAddress, options);
  }

  if (domain === MAILHOG_DOMAIN) {
    return await mailhogReceive(emailAddress, options);
  }

  throw new Error(`No API for mailbox on ${domain}`);
}
