import { confirm, intro, log, note, outro, spinner } from '@clack/prompts';
import { detectEnvironment, type Environment } from './detect.js';
import { installCli, isCliInstalled } from './setup/cli.js';
import { installCucumber, setupCucumber } from './setup/cucumber.js';
import { installGithubAction } from './setup/github-actions.js';
import { installMcpServer, isMcpServerInstalled } from './setup/mcp.js';
import { hasPlaywrightBrowsers, installPlaywrightBrowsers } from './setup/playwright.js';

const BDD_IMPORT = '@letsrunit/cucumber';

export interface InitOptions {
  yes?: boolean;
  noMcp?: boolean;
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

async function stepEnsureCucumber(env: Environment, { yes }: InitOptions): Promise<boolean> {
  if (env.hasCucumber) return true;

  if (!yes && !env.isInteractive) {
    log.warn('@cucumber/cucumber not found. Install it to use letsrunit with Cucumber:');
    note('npm install --save-dev @cucumber/cucumber\nThen run: npx letsrunit init', 'Setup Cucumber');
    return false;
  }

  if (!yes) {
    const install = await confirm({ message: '@cucumber/cucumber not found. Install it now?' });
    if (install !== true) return false;
  }

  const s = spinner();
  s.start('Installing @cucumber/cucumber…');
  installCucumber(env);
  s.stop('@cucumber/cucumber installed');
  return true;
}

async function stepInstallMcpServer(env: Environment, { yes, noMcp }: InitOptions): Promise<void> {
  if (noMcp) {
    log.info('Skipped @letsrunit/mcp-server installation (--no-mcp).');
    return;
  }

  if (isMcpServerInstalled(env)) {
    log.success('@letsrunit/mcp-server already installed');
    return;
  }

  if (!yes && env.isInteractive) {
    const install = await confirm({
      message: 'Install @letsrunit/mcp-server for project-local MCP support?',
      initialValue: true,
    });
    if (install !== true) {
      log.info('Skipped @letsrunit/mcp-server installation.');
      return;
    }
  }

  const s = spinner();
  s.start('Installing @letsrunit/mcp-server…');
  installMcpServer(env);
  s.stop('@letsrunit/mcp-server installed');
}

function stepSetupCucumber(env: Environment): void {
  const result = setupCucumber(env);

  if (result.bddInstalled) log.success('@letsrunit/cucumber installed');

  if (result.configResult === 'created') {
    log.success('features/support/world.js created');
  } else if (result.configResult === 'needs-manual-update') {
    log.warn('features/support/world.js exists but does not import @letsrunit/cucumber.');
    note(`Add "import '${BDD_IMPORT}';" to features/support/world.js`, 'Action required');
  }

  if (result.featuresCreated) log.success('features/ directory created with example.feature');
}

async function stepCheckPlaywrightBrowsers(env: Environment, { yes }: InitOptions): Promise<void> {
  if (hasPlaywrightBrowsers(env)) return;

  if (!yes && !env.isInteractive) {
    log.warn('Playwright Chromium browser not found.');
    note('npx playwright install chromium', 'Run to install browsers');
    return;
  }

  if (!yes) {
    const install = await confirm({ message: 'Playwright Chromium browser not found. Install it now?' });
    if (install !== true) return;
  }

  const s = spinner();
  s.start('Installing Playwright Chromium…');
  installPlaywrightBrowsers(env);
  s.stop('Playwright Chromium installed');
}

async function stepAddGithubAction(env: Environment, { yes }: InitOptions): Promise<void> {
  if (!yes && !env.isInteractive) return;

  if (!yes) {
    const addAction = await confirm({ message: 'Add a GitHub Action to run features on push?' });
    if (addAction !== true) return;
  }

  const result = installGithubAction(env);
  if (result === 'created') {
    log.success('.github/workflows/letsrunit.yml created');
  } else {
    log.info('.github/workflows/letsrunit.yml already exists, skipped');
  }
}

export async function init(options: InitOptions = {}): Promise<void> {
  intro('letsrunit init');

  const env = detectEnvironment();

  await stepInstallCli(env);
  await stepInstallMcpServer(env, options);

  const hasCucumber = await stepEnsureCucumber(env, options);
  if (hasCucumber) {
    stepSetupCucumber(env);
    await stepCheckPlaywrightBrowsers(env, options);
    await stepAddGithubAction(env, options);
  }

  outro('All done! Run npx letsrunit --help to get started.');
}
