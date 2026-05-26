import { confirm, intro, isCancel, log, multiselect, note, outro, password, select, spinner } from '@clack/prompts';
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
import { recommendedBaseUrl, updateCucumberBaseUrl } from './setup/ci-workflow-plan.js';
import { detectAppTarget, type DetectionResult, type AppTarget } from './setup/project-app.js';
import { installMcpServer, isMcpServerInstalled } from './setup/mcp.js';
import {
  hasPlaywrightBrowsers,
  installPlaywright,
  installPlaywrightBrowsers,
  isPlaywrightInstalled,
} from './setup/playwright.js';

const BDD_IMPORT = '@letsrunit/cucumber';

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

function stepSetupCucumber(env: Environment, appTarget: DetectionResult<AppTarget>): void {
  const result = setupCucumber(env, { baseUrl: appTarget.value.baseUrl });

  if (result.bddInstalled) log.success('@letsrunit/cucumber installed');

  if (result.configResult === 'created') {
    log.success('features/support/world.js created');
  } else if (result.configResult === 'needs-manual-update') {
    log.warn('features/support/world.js exists but does not import @letsrunit/cucumber.');
    note(`Add "import '${BDD_IMPORT}';" to features/support/world.js`, 'Action required');
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

function stepAddGithubAction(env: Environment, appTarget: DetectionResult<AppTarget>): void {
  const result = installGithubAction(env, { appTarget });
  if (result.status === 'created') {
    log.success('.github/workflows/letsrunit.yml created');
  } else {
    log.info('.github/workflows/letsrunit.yml already exists, skipped');
  }

  const baseUrl = recommendedBaseUrl(result.plan);
  if (baseUrl !== 'http://localhost:3000') {
    const update = updateCucumberBaseUrl(env.cwd, baseUrl);
    if (update === 'updated') {
      log.success(`cucumber.js baseURL updated to ${baseUrl}`);
    }
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

  const installPlaywright = await askBoolean('Set up browser runtime (Playwright Chromium)?', true);
  const installCucumber = await askBoolean('Install and scaffold Cucumber support?', true);
  const installCli = await askBoolean('Install the letsrunit CLI?', false);
  const configureCliAi = installCli ? await selectCliAiConfig() : null;

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

  if (plan.installCucumber) stepInstallCucumber(env);
  if (env.hasCucumber || plan.installCucumber) {
    stepSetupCucumber(env, appTarget);
  }

  if (plan.installCli) await stepInstallCli(env);
  if (plan.configureCliAi) stepConfigureCliAi(env, plan.configureCliAi);
  else if (plan.installCli) note(formatManualCliAiSetupInstructions(), 'Manual CLI AI setup');

  if (plan.installMcp) stepInstallMcpServer(env);

  await setupAgents(env, { agents: plan.agents });
  if (plan.addGithubActions) stepAddGithubAction(env, appTarget);

  outro('All done! Run npx letsrunit --help to get started.');
}
