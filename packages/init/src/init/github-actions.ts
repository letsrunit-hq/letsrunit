import { confirm, isCancel, log, note, select, text } from '@clack/prompts';
import { hasExplicitInitSelections } from '../init-options.js';
import { installGithubAction } from '../setup/github-actions.js';
import {
  buildCiWorkflowPlan,
  dbDefaults,
  type CiDbService,
  type CiWorkflowPlanOverrides,
  type SupabaseMode,
} from '../setup/ci-workflow-plan.js';
import type { InitContext, MailSetup } from './context.js';

const GITHUB_ACTIONS_EXPLANATION = [
  'GitHub Actions runs the feature suite in CI on pushes and pull requests.',
  'Letsrunit generates a workflow that installs dependencies, starts your app, waits for the configured base URL, and runs Cucumber.',
].join('\n');

type GithubActionsContext = Pick<InitContext, 'env' | 'options' | 'appTarget' | 'baseUrl' | 'mailSetup'>;

function assertNotCanceled<T>(value: T | symbol): T {
  if (isCancel(value)) throw new Error('Initialization canceled.');
  return value;
}

async function askText(message: string, initialValue: string): Promise<string> {
  const value = assertNotCanceled(await text({ message, initialValue }));
  return value.trim() || initialValue;
}

async function selectOptionalCommand(message: string, current: string | null): Promise<string | null> {
  const value = await askText(message, current ?? '');
  return value || null;
}

async function shouldSetupGithubActions(context: GithubActionsContext): Promise<boolean> {
  if (hasExplicitInitSelections(context.options)) return Boolean(context.options.withGithubActions);

  note(GITHUB_ACTIONS_EXPLANATION, 'GitHub Actions');
  return assertNotCanceled(await confirm({ message: 'Add a GitHub Actions workflow?', initialValue: false }));
}

async function selectDbService(defaultService: CiDbService): Promise<CiDbService> {
  return assertNotCanceled(
    await select({
      message: 'Database service for GitHub Actions',
      options: [
        { value: 'none' as CiDbService, label: 'None' },
        { value: 'postgres' as CiDbService, label: 'Postgres' },
        { value: 'supabase' as CiDbService, label: 'Supabase' },
        { value: 'mysql' as CiDbService, label: 'MySQL' },
        { value: 'mongodb' as CiDbService, label: 'MongoDB' },
      ],
      initialValue: defaultService,
    }),
  );
}

async function selectSupabaseMode(defaultMode: SupabaseMode): Promise<SupabaseMode> {
  return assertNotCanceled(
    await select({
      message: 'Supabase mode for GitHub Actions',
      options: [
        { value: 'local' as SupabaseMode, label: 'Local Supabase in CI' },
        { value: 'hosted' as SupabaseMode, label: 'Hosted Supabase via secrets' },
      ],
      initialValue: defaultMode,
    }),
  );
}

function defaultMailSetup(): MailSetup {
  return { config: { service: 'none' }, env: { LETSRUNIT_MAILBOX_SERVICE: 'none' } };
}

async function selectCiWorkflowOverrides(context: GithubActionsContext): Promise<CiWorkflowPlanOverrides | undefined> {
  const baseUrl = context.baseUrl ?? context.appTarget.value.baseUrl;
  const mail = context.mailSetup ?? defaultMailSetup();

  if (!context.env.isInteractive) {
    return {
      baseUrl: { value: baseUrl, confidence: 'high', evidence: ['init base URL'] },
      mail: { value: mail.config, confidence: 'high', evidence: ['init mail setup'] },
    };
  }

  const detected = buildCiWorkflowPlan(context.env, {
    appTarget: context.appTarget,
    overrides: { mail: { value: mail.config, confidence: 'high', evidence: ['init mail setup'] } },
  });
  const buildCommand = await selectOptionalCommand('Build command for GitHub Actions', detected.buildCommand.value);
  const startCommand = await askText('Start command for GitHub Actions', detected.startCommand.value);
  const ciBaseUrl = await askText('Base URL GitHub Actions should wait for', baseUrl);
  const service = await selectDbService(detected.db.value.service);
  const defaults =
    detected.db.value.service === service
      ? { ...dbDefaults(service), ...detected.db.value, service }
      : dbDefaults(service);
  const name = service === 'none' ? defaults.name : await askText('Database name', defaults.name);
  const user = service === 'none' ? defaults.user : await askText('Database user', defaults.user);
  const dbPassword = service === 'none' ? defaults.password : await askText('Database password', defaults.password);
  const supabaseMode =
    service === 'supabase' ? await selectSupabaseMode(defaults.supabaseMode ?? 'local') : defaults.supabaseMode;
  const migrationCommand = await selectOptionalCommand('Migration command (optional)', detected.migrationCommand.value);
  const seedCommand = await selectOptionalCommand('Seed command (optional)', detected.seedCommand.value);

  return {
    buildCommand: { value: buildCommand, confidence: 'high', evidence: ['interactive confirmation'] },
    startCommand: { value: startCommand, confidence: 'high', evidence: ['interactive confirmation'] },
    baseUrl: { value: ciBaseUrl, confidence: 'high', evidence: ['interactive confirmation'] },
    db: {
      value: { service, name, user, password: dbPassword, supabaseMode },
      confidence: 'high',
      evidence: ['interactive confirmation'],
    },
    migrationCommand: { value: migrationCommand, confidence: 'high', evidence: ['interactive confirmation'] },
    seedCommand: { value: seedCommand, confidence: 'high', evidence: ['interactive confirmation'] },
    mail: { value: mail.config, confidence: 'high', evidence: ['init mail setup'] },
  };
}

function applyGithubActionsSetup(context: GithubActionsContext, overrides?: CiWorkflowPlanOverrides): void {
  const result = installGithubAction(context.env, { appTarget: context.appTarget, overrides });
  if (result.status === 'created') {
    log.success('.github/workflows/letsrunit.yml created');
  } else {
    log.info('.github/workflows/letsrunit.yml already exists, skipped');
    note(
      [
        `Detected base URL: ${result.plan.baseUrl.value}`,
        `Detected start command: ${result.plan.startCommand.value}`,
        `Detected DB service: ${result.plan.db.value.service}`,
      ].join('\n'),
      'GitHub Actions guidance',
    );
  }
}

export async function setupGithubActions(context: GithubActionsContext): Promise<void> {
  if (!(await shouldSetupGithubActions(context))) return;

  const overrides = await selectCiWorkflowOverrides(context);
  applyGithubActionsSetup(context, overrides);
}
