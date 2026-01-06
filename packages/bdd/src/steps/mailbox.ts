import { receiveMail, toEml } from '@letsrunit/mailbox';
import { asFilename, textToHtml } from '@letsrunit/utils';
import { Given, Then } from './wrappers';

const MAX_RECEIVE_WAIT = 120_000; // 2 minutes

export const view = Given(
  `I'm viewing an email sent to {string} with subject {string}`,
  async function (address: string, subject: string) {
    const emails = await receiveMail(address, { full: true, after: this.startTime, subject, limit: 1 });
    if (emails.length === 0) {
      throw new Error(`Did not receive an email with subject "${subject}"`);
    }

    const email = emails[0];

    await this.page.goto('about:blank', { waitUntil: 'load' });
    await this.page.setContent(email.html ?? textToHtml(email.text!), { waitUntil: 'domcontentloaded' });
  },
);

export const receive = Then(
  'I received an email sent to {string} with subject {string}',
  async function (subject: string, address: string) {
    const emails = await receiveMail(address, {
      after: this.startTime,
      full: true,
      subject,
      wait: true,
      timeout: MAX_RECEIVE_WAIT,
      limit: 1,
    });

    if (emails.length === 0) {
      throw new Error(`Did not receive an email with subject "${subject}"`);
    }

    const email = emails[0];

    this.attach(toEml(email), {
      mediaType: 'message/rfc822',
      fileName: asFilename(email.subject, 'eml'),
    });
  },
);
