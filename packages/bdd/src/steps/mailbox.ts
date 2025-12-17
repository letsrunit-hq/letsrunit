import { receive } from '@letsrunit/mailbox';
import type { World } from '../types';
import { Then } from './wrappers';

const MAX_WAIT = 120_000; // 2 minutes

export const see = Then(
  'mailbox {string} receives an email with subject {string}',
  async (world: World, address: string, subject: string) => {
    world.lastMailboxCheck ??= {};
    const timestampAfter = world.lastMailboxCheck[address] ?? world.startTime;
    const signal = AbortSignal.timeout(MAX_WAIT);

    const emails = await receive(address, { after: timestampAfter, subject, wait: true, signal });

    if (emails.length === 0) {
      throw new Error(`Did not receive an email with subject "${subject}"`);
    }

    world.lastMailboxCheck[address] = Math.max(...emails.map((e) => e.timestamp)) + 1;
  },
);
