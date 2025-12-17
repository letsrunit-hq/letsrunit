import { MAILBOX_SERVICE } from './constants';
import { receiveMail as mailhogReceive } from './mailhog/receive';
import { receiveMail as mailpitReceive } from './mailpit/receive';
import { receiveMail as testmailReceive } from './testmail/receive';
import type { Email, ReceiveOptions } from './types';

export async function receiveMail(emailAddress: string, options: ReceiveOptions = {}): Promise<Email[]> {
  switch (MAILBOX_SERVICE) {
    case 'testmail':
      return await testmailReceive(emailAddress, options);
    case 'mailhog':
      return await mailhogReceive(emailAddress, options);
    case 'mailpit':
      return await mailpitReceive(emailAddress, options);
    default:
      throw new Error(`Unsupported mailbox service ${MAILBOX_SERVICE}`);
  }
}
