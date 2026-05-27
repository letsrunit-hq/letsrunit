import { isCancel, log, note, password, select, text } from '@clack/prompts';
import type { CiMailService } from '../setup/ci-workflow-plan.js';
import { writeLetsrunitEnv } from '../setup/cli-ai.js';
import type { InitContext, MailSetup } from './context.js';

const MAIL_EXPLANATION = [
  'Mailbox setup lets letsrunit test email journeys such as signup links, OTP codes, and password resets.',
  'Letsrunit stores only its mailbox settings. You still configure your app SMTP settings manually because app env names vary.',
].join('\n');

type MailContext = Pick<InitContext, 'env' | 'mailSetup'>;

function assertNotCanceled<T>(value: T | symbol): T {
  if (isCancel(value)) throw new Error('Initialization canceled.');
  return value;
}

async function askText(message: string, initialValue: string): Promise<string> {
  const value = assertNotCanceled(await text({ message, initialValue }));
  return value.trim() || initialValue;
}

function currentMailSetup(): MailSetup {
  const service = process.env.LETSRUNIT_MAILBOX_SERVICE;
  if (service === 'mailpit') {
    const baseUrl = process.env.LETSRUNIT_MAILPIT_BASE_URL ?? 'http://localhost:8025';
    return {
      config: { service, mailpitBaseUrl: baseUrl },
      env: { LETSRUNIT_MAILBOX_SERVICE: service, LETSRUNIT_MAILPIT_BASE_URL: baseUrl },
    };
  }
  if (service === 'mailhog') {
    const baseUrl = process.env.LETSRUNIT_MAILHOG_BASE_URL ?? 'http://localhost:8025';
    return {
      config: { service, mailhogBaseUrl: baseUrl },
      env: { LETSRUNIT_MAILBOX_SERVICE: service, LETSRUNIT_MAILHOG_BASE_URL: baseUrl },
    };
  }
  if (service === 'testmail') {
    return {
      config: { service, testmailDomain: process.env.LETSRUNIT_MAILBOX_DOMAIN ?? 'inbox.testmail.app' },
      env: {
        LETSRUNIT_MAILBOX_SERVICE: service,
        LETSRUNIT_TESTMAIL_API_KEY: process.env.LETSRUNIT_TESTMAIL_API_KEY,
        LETSRUNIT_TESTMAIL_NAMESPACE: process.env.LETSRUNIT_TESTMAIL_NAMESPACE,
        LETSRUNIT_MAILBOX_DOMAIN: process.env.LETSRUNIT_MAILBOX_DOMAIN ?? 'inbox.testmail.app',
      },
    };
  }
  return { config: { service: 'none' }, env: { LETSRUNIT_MAILBOX_SERVICE: 'none' } };
}

async function selectMailSetup(context: MailContext): Promise<MailSetup> {
  const current = currentMailSetup();
  if (!context.env.isInteractive) return current;

  note(MAIL_EXPLANATION, 'Email testing');
  const service = assertNotCanceled(
    await select({
      message: 'Configure mailbox service for email testing',
      options: [
        { value: 'none' as CiMailService, label: 'None' },
        { value: 'mailpit' as CiMailService, label: 'Mailpit' },
        { value: 'testmail' as CiMailService, label: 'Testmail' },
        { value: 'mailhog' as CiMailService, label: 'MailHog' },
      ],
      initialValue: current.config.service,
    }),
  );

  if (service === 'mailpit') {
    const baseUrl = await askText('Mailpit web/API base URL', current.config.mailpitBaseUrl ?? 'http://localhost:8025');
    return {
      config: { service, mailpitBaseUrl: baseUrl },
      env: { LETSRUNIT_MAILBOX_SERVICE: service, LETSRUNIT_MAILPIT_BASE_URL: baseUrl },
    };
  }

  if (service === 'mailhog') {
    const baseUrl = await askText('MailHog web/API base URL', current.config.mailhogBaseUrl ?? 'http://localhost:8025');
    return {
      config: { service, mailhogBaseUrl: baseUrl },
      env: { LETSRUNIT_MAILBOX_SERVICE: service, LETSRUNIT_MAILHOG_BASE_URL: baseUrl },
    };
  }

  if (service === 'testmail') {
    const apiKey = assertNotCanceled(
      await password({
        message: 'LETSRUNIT_TESTMAIL_API_KEY (optional, leave blank to set manually)',
        mask: '*',
      }),
    ).trim();
    const namespace = await askText(
      'LETSRUNIT_TESTMAIL_NAMESPACE',
      process.env.LETSRUNIT_TESTMAIL_NAMESPACE ?? 'your_namespace',
    );
    const domain = await askText('LETSRUNIT_MAILBOX_DOMAIN', current.config.testmailDomain ?? 'inbox.testmail.app');
    return {
      config: { service, testmailDomain: domain },
      env: {
        LETSRUNIT_MAILBOX_SERVICE: service,
        LETSRUNIT_TESTMAIL_API_KEY: apiKey || undefined,
        LETSRUNIT_TESTMAIL_NAMESPACE: namespace,
        LETSRUNIT_MAILBOX_DOMAIN: domain,
      },
    };
  }

  return { config: { service: 'none' }, env: { LETSRUNIT_MAILBOX_SERVICE: 'none' } };
}

function applyMailSetup(context: MailContext, mailSetup: MailSetup): void {
  const result = writeLetsrunitEnv(context.env.cwd, mailSetup.env);
  if (result === 'skipped') log.info('.letsrunit/.env already up to date');
  else log.success(`.letsrunit/.env ${result}`);

  if (mailSetup.config.service === 'mailpit') {
    note('Configure your app SMTP settings for Mailpit manually; app env names vary by project.', 'Mail setup');
  } else if (mailSetup.config.service === 'mailhog') {
    note('Configure your app SMTP settings for MailHog manually; app env names vary by project.', 'Mail setup');
  }
}

export async function setupMail(context: MailContext): Promise<void> {
  const mailSetup = await selectMailSetup(context);
  applyMailSetup(context, mailSetup);
  context.mailSetup = mailSetup;
}
