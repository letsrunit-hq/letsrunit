import { AGENT_IDS } from './setup/agents/types.js';

export interface InitOptions {
  withCli?: boolean;
  withMcp?: boolean;
  withCucumber?: boolean;
  withPlaywright?: boolean;
  withGithubActions?: boolean;
  agents?: string | string[];
}

export interface InitPlanOptions {
  installCli: boolean;
  installMcp: boolean;
  installCucumber: boolean;
  installPlaywright: boolean;
  addGithubActions: boolean;
  configureAgents: boolean;
}

function hasAgentSelection(agents: InitOptions['agents']): boolean {
  if (Array.isArray(agents)) return agents.length > 0;
  return Boolean(agents?.trim());
}

export function hasExplicitInitSelections(options: InitOptions): boolean {
  return Boolean(
    options.withCli ||
    options.withMcp ||
    options.withCucumber ||
    options.withPlaywright ||
    options.withGithubActions ||
    hasAgentSelection(options.agents),
  );
}

export function shouldShowInitHelp(isInteractive: boolean, options: InitOptions): boolean {
  return !isInteractive && !hasExplicitInitSelections(options);
}

export function resolveInitPlanOptions(options: InitOptions): InitPlanOptions {
  const configureAgents = hasAgentSelection(options.agents);
  const installMcp = Boolean(options.withMcp) || configureAgents;
  const installCucumber = Boolean(options.withCucumber);
  const installPlaywright = Boolean(options.withPlaywright);
  const addGithubActions = Boolean(options.withGithubActions);
  const installCli = Boolean(options.withCli);

  return {
    installCli,
    installMcp,
    installCucumber,
    installPlaywright,
    addGithubActions,
    configureAgents,
  };
}

export function formatInitHelp(command = 'letsrunit init'): string {
  return [
    `Usage: ${command} [options]`,
    '',
    'Install nothing by default. Choose components explicitly:',
    '  --with-cli              Install @letsrunit/cli',
    '  --with-mcp              Install @letsrunit/mcp-server',
    '  --with-cucumber         Install @cucumber/cucumber and scaffold Cucumber support',
    '  --with-playwright       Install @playwright/test and Playwright Chromium',
    '  --with-github-actions   Add .github/workflows/letsrunit.yml',
    `  --agents <list>         Configure MCP + skill for agents (${AGENT_IDS.join(', ')})`,
    '  -h, --help              Show this help',
    '',
    'Interactive terminals can run `letsrunit init` with no options to choose components in a prompt.',
    'Non-interactive terminals must pass one or more options explicitly.',
  ].join('\n');
}
