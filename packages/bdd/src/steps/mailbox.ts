import { receiveMail } from '@letsrunit/mailbox';
import type { World } from '../types';
import { Given, Then } from './wrappers';

const MAX_RECEIVE_WAIT = 120_000; // 2 minutes

export const view = Given(
  `I'm viewing an email sent to {string} with subject {string}`,
  async (world: World, address: string, subject: string) => {
    const emails = await receiveMail(address, { full: true, after: world.startTime, subject, limit: 1 });
    if (emails.length === 0) throw new Error(`Did not receive an email with subject "${subject}"`);

    await world.page.goto('about:blank', { waitUntil: 'load' });
    await world.page.setContent(emails[0].html ?? emails[0].text!, { waitUntil: 'domcontentloaded' });
  },
);

export const receive = Then(
  'mailbox {string} received an email with subject {string}',
  async (world: World, address: string, subject: string) => {
    const emails = await receiveMail(
      address,
      { after: world.startTime, subject, wait: true, timeout: MAX_RECEIVE_WAIT, limit: 1 },
    );
    if (emails.length === 0) throw new Error(`Did not receive an email with subject "${subject}"`);
  },
);
