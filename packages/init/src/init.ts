import {
  confirm,
  intro,
  isCancel,
  log,
  multiselect,
  note,
  outro,
  password,
  select,
  spinner,
  text,
} from '@clack/prompts';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { AgentId } from './setup/agents/types.js';
import { detectEnvironment, type Environment } from './detect.js';
import {
  formatInitHelp,
  hasExplicitInitSelections,
  type InitOptions,
  resolveInitPlanOptions,
  shouldShowInitHelp,
} from './init-options.js';
import { installCli, isCliInstalled } from './setup/cli.js';
import {
  ensureLetsrunitIgnored,
  formatManualCliAiSetupInstructions,
  type AiProvider,
  type ModelTier,
  providerPreset,
  PROVIDER_PRESETS,
  writeLetsrunitEnv,
} from './setup/cli-ai.js';
import { installCucumber, setupCucumber } from './setup/cucumber.js';
import { detectAgentIds, getAgentCatalog, parseAgents, setupAgents } from './setup/agents.js';
import { installGithubAction } from './setup/github-actions.js';
import {
  buildCiWorkflowPlan,
  dbDefaults,
  type CiDbService,
  type CiMailConfig,
  type CiMailService,
  type CiWorkflowPlanOverrides,
  type SupabaseMode,
} from './setup/ci-workflow-plan.js';
import { detectAppTarget, type DetectionResult, type AppTarget } from './setup/project-app.js';
import { installMcpServer, isMcpServerInstalled } from './setup/mcp.js';
import {
  hasPlaywrightBrowsers,
  installPlaywright,
  installPlaywrightBrowsers,
  isPlaywrightInstalled,
} from './setup/playwright.js';

const BDD_IMPORT = '@letsrunit/cucumber';

const SETUP_EXPLANATIONS = {
  playwright: [
    'Playwright is the browser automation engine letsrunit uses to click, type, inspect pages, and capture artifacts.',
    'This installs @playwright/test and a Chromium browser so tests can run against your app.',
  ].join('\n'),
  cucumber: [
    'Cucumber is the test runner for .feature files written in Gherkin, such as "Given I am on the homepage".',
    'Letsrunit adds @cucumber/cucumber, a cucumber.js config, and a support file that registers the built-in browser steps from @letsrunit/cucumber.',
  ].join('\n'),
  cli: [
    'The letsrunit CLI provides terminal commands for generating tests and explaining tests failures. It requires an AI API key to work.',
    'Install it if you\'re not using an AI coding agent (such as Claude or Codex), but want to use AI to generate and debug tests from the terminal.',
  ].join('\n'),
  agents: [
    'Agent integration configures MCP so AI coding agents can inspect your project, load your support files, and run letsrunit steps.',
    'Use this if you want tools such as Codex, Cursor, Claude Code, Copilot, Gemini, or Windsurf to drive tests from the project.',
  ].join('\n'),
  githubActions: [
    'GitHub Actions runs the feature suite in CI on pushes and pull requests.',
    'Letsrunit generates a workflow that installs dependencies, starts your app, waits for the configured base URL, and runs Cucumber.',
  ].join('\n'),
} as const;

const BANNER = String.raw`
        .:::::.                                                                                                         
     .:::::::::::.          ...                                                                      .-:                
   .::::::   ::::::         =+=                 .                                                    -+=.    .          
  .:::           :::        =+=                -+                                                           -+          
  ::::           ::::       =+=    .-=+==:   -=++===   :==+==:    ==  -==  ==:    .==   -=  :=+=-    :==  -=++===       
 .:::.   .:::.   .:::.      =+=   =+=:..=+=  :-++-::  =+-...-++   ++.==-=  ++:    :++   =+.--.:=++   -++  :=++-::       
 .::     :::::     ::.      =+=  -++     =+:  .++     ++-    .    ++-:     ++:    :++   =+=.   .++:  -++   :++          
 .:::.   .:::    .:::.      =+=  =++=====++-  .++     .=+++=-:    ++=      ++:    :++   =+=     ++-  -++   :++          
  ::::           ::::       =+=  =+=          .++         .:-++:  ++-      ++-    =++   =+=     ++-  -++   :++          
  .:::           :::        =+=  .++:    -=:  .++:    -=     =+-  ++-      =+=   ::++   =+=     ++-  -++   :++.     .   
    ::::::   ::::::         =+=   .=+=-=++-    =++++  :++====+=   ++-      .+++=+- ++   =+=     ++-  -++    =++++  :::  
     .:::::::::::.           .       .::.       ..:.    ..::.     ..         .:.   ..    .      ..    ..     .::.       
        .::::..                                                                                                         `;

interface InstallPlan {
  installCli: boolean;
  configureCliAi: CliAiConfig | null;
  installMcp: boolean;
  installCucumber: boolean;
  installPlaywright: boolean;
  addGithubActions: boolean;
  agents: AgentId[];
}

interface CliAiConfig {
  provider: AiProvider;
  models: Record<ModelTier, string>;
  apiKey?: string;
}

interface MailSetup {
  config: CiMailConfig;
  env: Record<string, string | undefined>;
}

function showBanner(): void {
  console.log(BANNER);
}

async function stepInstallCli(env: Environment): Promise<void> {
  if (isCliInstalled(env)) {
    log.success('@letsrunit/cli already installed');
    return;
  }

  const s = spinner();
  s.start('Installing @letsrunit/cli…');
  installCli(env);
  s.stop('@letsrunit/cli installed');
}

function stepConfigureCliAi(env: Environment, config: CliAiConfig): void {
  const preset = providerPreset(config.provider);
  const result = writeLetsrunitEnv(env.cwd, {
    LETSRUNIT_AI_PROVIDER: config.provider,
    LETSRUNIT_MODEL_LARGE: config.models.large,
    LETSRUNIT_MODEL_MEDIUM: config.models.medium,
    LETSRUNIT_MODEL_SMALL: config.models.small,
    [preset.keyName]: config.apiKey,
  });

  if (result === 'skipped') log.info('.letsrunit/.env already up to date');
  else log.success(`.letsrunit/.env ${result}`);
}

function stepInstallMcpServer(env: Environment): void {
  if (isMcpServerInstalled(env)) {
    log.success('@letsrunit/mcp-server already installed');
    return;
  }

  const s = spinner();
  s.start('Installing @letsrunit/mcp-server…');
  installMcpServer(env);
  s.stop('@letsrunit/mcp-server installed');
}

function stepInstallCucumber(env: Environment): void {
  if (env.hasCucumber) {
    log.success('@cucumber/cucumber already installed');
    return;
  }

  const s = spinner();
  s.start('Installing @cucumber/cucumber…');
  installCucumber(env);
  s.stop('@cucumber/cucumber installed');
}

function stepSetupCucumber(env: Environment, baseUrl: string): void {
  const hadCucumberConfig = existsSync(join(env.cwd, 'cucumber.js'));
  const result = setupCucumber(env, { baseUrl });

  if (result.bddInstalled) log.success('@letsrunit/cucumber installed');

  if (result.configResult === 'created') {
    log.success('features/support/world.js created');
  } else if (result.configResult === 'needs-manual-update') {
    log.warn('features/support/world.js exists but does not import @letsrunit/cucumber.');
    note(`Add "import '${BDD_IMPORT}';" to features/support/world.js`, 'Action required');
  }

  if (hadCucumberConfig) {
    note(
      'cucumber.js already exists, so init did not modify it. Add `process.env.LETSRUNIT_BASE_URL` as the baseURL fallback manually if needed.',
      'Cucumber config',
    );
  }

  if (result.featuresCreated) log.success('features/ directory created with example.feature');
}

function stepInstallPlaywright(env: Environment): void {
  if (!isPlaywrightInstalled(env)) {
    const install = spinner();
    install.start('Installing @playwright/test…');
    installPlaywright(env);
    install.stop('@playwright/test installed');
  } else {
    log.success('@playwright/test already installed');
  }

  if (hasPlaywrightBrowsers(env)) {
    log.success('Playwright Chromium already installed');
    return;
  }

  const s = spinner();
  s.start('Installing Playwright Chromium…');
  installPlaywrightBrowsers(env);
  s.stop('Playwright Chromium installed');
}

function stepWriteRuntimeEnv(env: Environment, values: Record<string, string | undefined>): void {
  const result = writeLetsrunitEnv(env.cwd, values);
  if (result === 'skipped') log.info('.letsrunit/.env already up to date');
  else log.success(`.letsrunit/.env ${result}`);
}

function stepAddGithubAction(
  env: Environment,
  appTarget: DetectionResult<AppTarget>,
  overrides?: CiWorkflowPlanOverrides,
): void {
  const result = installGithubAction(env, { appTarget, overrides });
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

function optionPlan(options: InitOptions, explicitAgents: AgentId[]): InstallPlan {
  const resolved = resolveInitPlanOptions(options);
  return {
    installCli: resolved.installCli,
    configureCliAi: null,
    installMcp: resolved.installMcp,
    installCucumber: resolved.installCucumber,
    installPlaywright: resolved.installPlaywright,
    addGithubActions: resolved.addGithubActions,
    agents: explicitAgents,
  };
}

function assertNotCanceled<T>(value: T | symbol, message = 'Initialization canceled.'): T {
  if (isCancel(value)) {
    throw new Error(message);
  }
  return value;
}

async function askBoolean(message: string, initialValue: boolean): Promise<boolean> {
  return assertNotCanceled(await confirm({ message, initialValue }));
}

function explainSetupComponent(component: keyof typeof SETUP_EXPLANATIONS, title: string): void {
  note(SETUP_EXPLANATIONS[component], title);
}

async function askText(message: string, initialValue: string): Promise<string> {
  const value = assertNotCanceled(await text({ message, initialValue }));
  return value.trim() || initialValue;
}

async function selectModel(provider: AiProvider, tier: ModelTier): Promise<string> {
  const preset = providerPreset(provider);
  return assertNotCanceled(
    await select({
      message: `Choose ${tier} model`,
      options: preset.models[tier].map((model) => ({ value: model, label: model })),
      initialValue: preset.defaults[tier],
    }),
  );
}

async function selectCliAiConfig(): Promise<CliAiConfig | null> {
  const configure = await askBoolean('Configure CLI AI provider and models now?', true);
  if (!configure) {
    return null;
  }

  const provider = assertNotCanceled(
    await select({
      message: 'Choose AI provider',
      options: PROVIDER_PRESETS.map((preset) => ({ value: preset.provider, label: preset.label })),
      initialValue: 'openai' as AiProvider,
    }),
  );
  const preset = providerPreset(provider);
  const large = await selectModel(provider, 'large');
  const medium = await selectModel(provider, 'medium');
  const small = await selectModel(provider, 'small');
  const apiKey = assertNotCanceled(
    await password({
      message: `${preset.keyName} (optional, leave blank to set manually)`,
      mask: '*',
    }),
  ).trim();

  return {
    provider,
    models: { large, medium, small },
    ...(apiKey ? { apiKey } : {}),
  };
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

async function selectBaseUrl(env: Environment, detected: DetectionResult<AppTarget>): Promise<string> {
  if (!env.isInteractive) return detected.value.baseUrl;
  return await askText('Base URL for letsrunit tests', detected.value.baseUrl);
}

async function selectMailSetup(env: Environment): Promise<MailSetup> {
  const current = currentMailSetup();
  if (!env.isInteractive) return current;

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

async function selectOptionalCommand(message: string, current: string | null): Promise<string | null> {
  const value = await askText(message, current ?? '');
  return value || null;
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

async function selectCiWorkflowOverrides(
  env: Environment,
  appTarget: DetectionResult<AppTarget>,
  baseUrl: string,
  mail: MailSetup,
): Promise<CiWorkflowPlanOverrides | undefined> {
  if (!env.isInteractive) return { baseUrl: { value: baseUrl, confidence: 'high', evidence: ['.letsrunit/.env'] } };

  const detected = buildCiWorkflowPlan(env, {
    appTarget,
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

async function selectPlan(
  env: Environment,
  options: InitOptions,
  detectedAgents: AgentId[],
): Promise<InstallPlan | null> {
  const agentValue = Array.isArray(options.agents) ? options.agents.join(',') : options.agents;
  const explicitAgents = parseAgents(agentValue);

  if (hasExplicitInitSelections(options)) {
    return optionPlan(options, explicitAgents);
  }

  if (shouldShowInitHelp(env.isInteractive, options)) {
    console.log(formatInitHelp());
    return null;
  }

  note(
    'Letsrunit can install the browser runtime, Cucumber support, CLI tools, AI agent integration, and CI workflow for this project.',
    'Setup',
  );

  explainSetupComponent('playwright', 'Playwright');
  const installPlaywright = await askBoolean('Set up browser runtime (Playwright Chromium)?', true);

  explainSetupComponent('cucumber', 'Cucumber');
  const installCucumber = await askBoolean('Install and scaffold Cucumber support?', true);

  explainSetupComponent('cli', 'CLI');
  const installCli = await askBoolean('Install the letsrunit CLI?', false);
  const configureCliAi = installCli ? await selectCliAiConfig() : null;

  explainSetupComponent('agents', 'AI agents');
  note('Use ↑/↓ to move, space to toggle, enter to continue.', 'Agent Controls');
  const selectedAgents = assertNotCanceled(
    await multiselect({
      message: 'Configure AI agents (MCP package + per-agent setup)',
      options: getAgentCatalog().map((agent) => ({
        value: agent.id,
        label: agent.label,
        hint: detectedAgents.includes(agent.id) ? 'detected' : undefined,
      })),
      initialValues: detectedAgents,
      required: false,
    }),
  ) as AgentId[];

  if (selectedAgents.length > 0) {
    note('Some agents may require user-level MCP config when project-scope MCP is not supported.', 'Agent setup');
  }

  explainSetupComponent('githubActions', 'GitHub Actions');
  const addGithubActions = await askBoolean('Add a GitHub Actions workflow?', false);

  return {
    installCli,
    configureCliAi,
    installMcp: selectedAgents.length > 0,
    installCucumber,
    installPlaywright,
    addGithubActions,
    agents: selectedAgents,
  };
}

export async function init(options: InitOptions = {}): Promise<void> {
  const env = detectEnvironment();
  const detectedAgents = detectAgentIds(env);
  const plan = await selectPlan(env, options, detectedAgents);
  if (!plan) return;

  intro('letsrunit init');
  showBanner();

  const appTarget = detectAppTarget(env.cwd);
  const ignoreResult = ensureLetsrunitIgnored(env.cwd);
  if (ignoreResult !== 'skipped') log.success(`.gitignore ${ignoreResult}`);

  if (plan.installPlaywright) stepInstallPlaywright(env);

  const baseUrl = await selectBaseUrl(env, appTarget);
  stepWriteRuntimeEnv(env, { LETSRUNIT_BASE_URL: baseUrl });

  if (plan.installCucumber) stepInstallCucumber(env);
  if (env.hasCucumber || plan.installCucumber) {
    stepSetupCucumber(env, baseUrl);
  }

  if (plan.installCli) await stepInstallCli(env);
  if (plan.configureCliAi) stepConfigureCliAi(env, plan.configureCliAi);
  else if (plan.installCli) note(formatManualCliAiSetupInstructions(), 'Manual CLI AI setup');

  if (plan.installMcp) stepInstallMcpServer(env);

  await setupAgents(env, { agents: plan.agents });
  const mailSetup = await selectMailSetup(env);
  stepWriteRuntimeEnv(env, mailSetup.env);
  if (mailSetup.config.service === 'mailpit') {
    note('Configure your app SMTP settings for Mailpit manually; app env names vary by project.', 'Mail setup');
  } else if (mailSetup.config.service === 'mailhog') {
    note('Configure your app SMTP settings for MailHog manually; app env names vary by project.', 'Mail setup');
  }

  if (plan.addGithubActions) {
    const ciOverrides = await selectCiWorkflowOverrides(env, appTarget, baseUrl, mailSetup);
    stepAddGithubAction(env, appTarget, ciOverrides);
  }

  outro('All done! Run npx letsrunit --help to get started.');
}
