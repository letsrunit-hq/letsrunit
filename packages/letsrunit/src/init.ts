import { intro, isCancel, log, multiselect, note, outro, spinner } from '@clack/prompts';
import type { AgentId } from './setup/agents/types.js';
import { detectEnvironment, type Environment } from './detect.js';
import { installCli, isCliInstalled } from './setup/cli.js';
import { installCucumber, setupCucumber } from './setup/cucumber.js';
import { detectAgentIds, getAgentCatalog, parseAgents, setupAgents } from './setup/agents.js';
import { installGithubAction } from './setup/github-actions.js';
import { recommendedBaseUrl, updateCucumberBaseUrl } from './setup/ci-workflow-plan.js';
import { detectAppTarget, type DetectionResult, type AppTarget } from './setup/project-app.js';
import { installMcpServer, isMcpServerInstalled } from './setup/mcp.js';
import { hasPlaywrightBrowsers, installPlaywrightBrowsers } from './setup/playwright.js';

const BDD_IMPORT = '@letsrunit/cucumber';

export interface InitOptions {
  yes?: boolean;
  noMcp?: boolean;
  agents?: string | string[];
}

interface InstallPlan {
  installCli: boolean;
  installMcp: boolean;
  installCucumber: boolean;
  installPlaywright: boolean;
  addGithubActions: boolean;
  agents: AgentId[];
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

function defaultPlan(env: Environment, options: InitOptions, explicitAgents: AgentId[]): InstallPlan {
  const installCli = true;
  const installMcp = !options.noMcp;
  const installCucumber = true;
  const installPlaywright = true;
  const addGithubActions = true;
  const agents = explicitAgents.length > 0 ? explicitAgents : detectAgentIds(env);
  return { installCli, installMcp, installCucumber, installPlaywright, addGithubActions, agents };
}

async function selectPlan(env: Environment, options: InitOptions, defaults: InstallPlan): Promise<InstallPlan> {
  if (options.yes || !env.isInteractive) {
    if (!options.yes && !env.isInteractive && defaults.installCucumber) {
      log.warn('@cucumber/cucumber not found. Install it to use letsrunit with Cucumber:');
      note('npm install --save-dev @cucumber/cucumber\nThen run: npx letsrunit init', 'Setup Cucumber');
    }

    if (!options.yes && !env.isInteractive && defaults.installPlaywright) {
      log.warn('Playwright Chromium browser not found.');
      note('npx playwright install chromium', 'Run to install browsers');
    }

    return options.yes
      ? defaults
      : { ...defaults, installCli: false, installCucumber: false, installPlaywright: false, addGithubActions: false, agents: [] };
  }

  note('Use ↑/↓ to move, space to toggle, enter to continue.', 'Controls');

  const componentOptions = [
    { value: 'cli', label: '@letsrunit/cli', hint: 'test execution CLI', selected: defaults.installCli },
    { value: 'cucumber', label: 'Cucumber', hint: 'test runner integration', selected: defaults.installCucumber },
    { value: 'playwright', label: 'Playwright Chromium', hint: 'browser runtime', selected: defaults.installPlaywright },
    { value: 'gha', label: 'GitHub Actions workflow', hint: 'CI scaffold', selected: defaults.addGithubActions },
  ];

  if (!options.noMcp) {
    componentOptions.unshift({
      value: 'mcp',
      label: 'MCP Server',
      hint: 'project-local runtime',
      selected: defaults.installMcp,
    });
  } else {
    log.info('MCP Server disabled by --no-mcp.');
  }

  const components = await multiselect({
    message: 'Choose what to install/configure for this project',
    options: componentOptions,
    initialValues: componentOptions.filter((option) => option.selected).map((option) => option.value),
    required: false,
  });

  if (isCancel(components)) {
    throw new Error('Initialization canceled.');
  }

  const values = new Set((components ?? []) as string[]);
  const installMcp = options.noMcp ? false : values.has('mcp');

  let selectedAgents: AgentId[] = [];
  if (installMcp) {
    const catalog = getAgentCatalog();
    const picked = await multiselect({
      message: 'AI Agent integration (MCP config + skill)',
      options: catalog.map((agent) => ({
        value: agent.id,
        label: agent.label,
        selected: defaults.agents.includes(agent.id),
        hint: defaults.agents.includes(agent.id) ? 'detected' : undefined,
      })),
      initialValues: defaults.agents,
      required: false,
    });

    if (isCancel(picked)) {
      throw new Error('Initialization canceled.');
    }

    selectedAgents = (picked ?? []) as AgentId[];
  } else {
    log.info('MCP Server not selected. AI agent integration options skipped.');
  }

  return {
    installCli: values.has('cli'),
    installMcp,
    installCucumber: values.has('cucumber'),
    installPlaywright: values.has('playwright'),
    addGithubActions: values.has('gha'),
    agents: selectedAgents,
  };
}

export async function init(options: InitOptions = {}): Promise<void> {
  intro('⚙️  letsrunit.');
  
  const env = detectEnvironment();
  const appTarget = detectAppTarget(env.cwd);
  const agentValue = Array.isArray(options.agents) ? options.agents.join(',') : options.agents;
  const explicitAgents = parseAgents(agentValue);
  const plan = await selectPlan(env, options, defaultPlan(env, options, explicitAgents));

  if (plan.installCli) await stepInstallCli(env);
  else log.info('Skipped @letsrunit/cli installation.');

  if (plan.installMcp) stepInstallMcpServer(env);
  else if (options.noMcp) log.info('Skipped @letsrunit/mcp-server installation (--no-mcp).');

  await setupAgents(env, { agents: plan.agents, noMcp: Boolean(options.noMcp) });

  if (plan.installCucumber) stepInstallCucumber(env);
  if (env.hasCucumber || plan.installCucumber) {
    stepSetupCucumber(env, appTarget);
  }

  if (plan.installPlaywright) stepInstallPlaywright(env);
  if (plan.addGithubActions) stepAddGithubAction(env, appTarget);

  outro('All done! Run npx letsrunit --help to get started.');
}
