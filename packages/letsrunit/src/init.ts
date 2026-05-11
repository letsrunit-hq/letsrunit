import { intro, isCancel, log, multiselect, note, outro, spinner } from '@clack/prompts';
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
import { installCucumber, setupCucumber } from './setup/cucumber.js';
import { detectAgentIds, getAgentCatalog, parseAgents, setupAgents } from './setup/agents.js';
import { installGithubAction } from './setup/github-actions.js';
import { recommendedBaseUrl, updateCucumberBaseUrl } from './setup/ci-workflow-plan.js';
import { detectAppTarget, type DetectionResult, type AppTarget } from './setup/project-app.js';
import { installMcpServer, isMcpServerInstalled } from './setup/mcp.js';
import { hasPlaywrightBrowsers, installPlaywrightBrowsers } from './setup/playwright.js';

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
  installMcp: boolean;
  installCucumber: boolean;
  installPlaywright: boolean;
  addGithubActions: boolean;
  agents: AgentId[];
}

function normalizePlan(plan: InstallPlan): InstallPlan {
  const hasSelectedWork =
    plan.installCli || plan.installMcp || plan.installCucumber || plan.installPlaywright || plan.addGithubActions || plan.agents.length > 0;

  return {
    ...plan,
    installCli: hasSelectedWork,
  };
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
  return normalizePlan({
    installCli: resolved.installCli,
    installMcp: resolved.installMcp,
    installCucumber: resolved.installCucumber,
    installPlaywright: resolved.installPlaywright,
    addGithubActions: resolved.addGithubActions,
    agents: explicitAgents,
  });
}

async function selectPlan(env: Environment, options: InitOptions, detectedAgents: AgentId[]): Promise<InstallPlan | null> {
  const agentValue = Array.isArray(options.agents) ? options.agents.join(',') : options.agents;
  const explicitAgents = parseAgents(agentValue);

  if (hasExplicitInitSelections(options)) {
    return optionPlan(options, explicitAgents);
  }

  if (shouldShowInitHelp(env.isInteractive, options)) {
    console.log(formatInitHelp());
    return null;
  }

  note('Use ↑/↓ to move, space to toggle, enter to continue.', 'Controls');
  note('`@letsrunit/cli` is installed automatically when you select any component or agent setup.', 'Core Component');

  const componentOptions = [
    { value: 'cli', label: 'CLI', hint: '@letsrunit/cli', selected: false },
    { value: 'mcp', label: 'MCP Server', hint: 'project-local runtime', selected: false },
    { value: 'cucumber', label: 'Cucumber', hint: 'test runner integration', selected: false },
    { value: 'playwright', label: 'Playwright Chromium', hint: 'browser runtime', selected: false },
    { value: 'gha', label: 'GitHub Actions workflow', hint: 'CI scaffold', selected: false },
  ];

  const components = await multiselect({
    message: 'Choose what to install/configure for this project',
    options: componentOptions,
    initialValues: [],
    required: false,
  });

  if (isCancel(components)) {
    throw new Error('Initialization canceled.');
  }

  const values = new Set((components ?? []) as string[]);
  const installMcp = values.has('mcp');

  let selectedAgents: AgentId[] = [];
  if (installMcp) {
    const catalog = getAgentCatalog();
    note('Use ↑/↓ to move, space to toggle, enter to continue.', 'Agent Controls');
    const picked = await multiselect({
      message: 'AI Agent integration (MCP config + skill)',
      options: catalog.map((agent) => ({
        value: agent.id,
        label: agent.label,
        selected: false,
        hint: detectedAgents.includes(agent.id) ? 'detected' : undefined,
      })),
      initialValues: [],
      required: false,
    });

    if (isCancel(picked)) {
      throw new Error('Initialization canceled.');
    }

    selectedAgents = (picked ?? []) as AgentId[];
  } else {
    log.info('MCP Server not selected. AI agent integration options skipped.');
  }

  return normalizePlan({
    installCli: values.has('cli'),
    installMcp,
    installCucumber: values.has('cucumber'),
    installPlaywright: values.has('playwright'),
    addGithubActions: values.has('gha'),
    agents: selectedAgents,
  });
}

export async function init(options: InitOptions = {}): Promise<void> {
  const env = detectEnvironment();
  const detectedAgents = detectAgentIds(env);
  const plan = await selectPlan(env, options, detectedAgents);
  if (!plan) return;

  intro('letsrunit init');
  showBanner();

  const appTarget = detectAppTarget(env.cwd);

  if (plan.installCli) await stepInstallCli(env);

  if (plan.installMcp) stepInstallMcpServer(env);

  await setupAgents(env, { agents: plan.agents });

  if (plan.installCucumber) stepInstallCucumber(env);
  if (env.hasCucumber || plan.installCucumber) {
    stepSetupCucumber(env, appTarget);
  }

  if (plan.installPlaywright) stepInstallPlaywright(env);
  if (plan.addGithubActions) stepAddGithubAction(env, appTarget);

  outro('All done! Run npx letsrunit --help to get started.');
}
