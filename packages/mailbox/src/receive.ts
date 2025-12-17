import { MAILBOX_SERVICE } from './constants';
import { receive as mailhogReceive } from './mailhog/receive';
import { receive as mailpitReceive } from './mailpit/receive';
import { receive as testmailReceive } from './testmail/receive';
import type { Email, ReceiveOptions } from './types';

export async function receive(emailAddress: string, options: ReceiveOptions = {}): Promise<Email[]> {
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
