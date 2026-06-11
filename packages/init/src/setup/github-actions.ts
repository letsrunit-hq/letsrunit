import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Environment } from '../detect.js';
import { buildCiWorkflowPlan, type CiWorkflowPlan, type CiWorkflowPlanOverrides } from './ci-workflow-plan.js';
import type { DetectionResult, AppTarget } from './project-app.js';

export interface GithubActionsResult {
  status: 'created' | 'skipped';
  plan: CiWorkflowPlan;
}

function renderTodoComments(plan: CiWorkflowPlan): string {
  if (plan.todoNotes.length === 0) return '';
  const lines = plan.todoNotes.map((todo) => `      # ${todo}`);
  return `${lines.join('\n')}\n`;
}

function renderBuildStep(plan: CiWorkflowPlan): string {
  if (!plan.buildCommand.value) return '';
  if (plan.buildCommand.confidence !== 'high') return '';
  return `      - name: Build app
        run: ${plan.buildCommand.value}
`;
}

function renderServiceBlock(plan: CiWorkflowPlan): string {
  if (plan.serviceYamlLines.length === 0) return '';
  return `${plan.serviceYamlLines.join('\n')}\n`;
}

function renderSetupSteps(plan: CiWorkflowPlan): string {
  if (plan.setupSteps.length === 0) return '';
  return `${plan.setupSteps.join('\n')}\n`;
}

function renderContainerBlock(plan: CiWorkflowPlan): string {
  const version = plan.playwrightVersion.value;
  if (!version) return '';
  return `    container:
      image: mcr.microsoft.com/playwright:v${version}-noble
`;
}

function renderPreferIpv4LocalhostStep(plan: CiWorkflowPlan): string {
  if (!plan.playwrightVersion.value) return '';
  return `      - name: Prefer IPv4 localhost
        run: |
          python3 - <<'PY'
          from pathlib import Path

          hosts = Path("/etc/hosts")
          lines = hosts.read_text().splitlines()
          filtered = [line for line in lines if not line.startswith("::1") or "localhost" not in line]
          if not any(line.startswith("127.0.0.1") and "localhost" in line for line in filtered):
              filtered.insert(0, "127.0.0.1 localhost")
          hosts.write_text("\\n".join(filtered) + "\\n")
          PY
`;
}

function renderRunAndTestStep(plan: CiWorkflowPlan, waitUrl: string): string {
  return `      - name: Run and test
        run: |
          ${plan.startCommand.value} &
          wait-on --timeout 30000 http-get://${waitUrl.replace(/^https?:\/\//, '')}
          ${plan.runCucumberCommand}
`;
}

function workflowYaml(plan: CiWorkflowPlan): string {
  const containerBlock = renderContainerBlock(plan);
  const serviceBlock = renderServiceBlock(plan);
  const todoComments = renderTodoComments(plan);
  const buildStep = renderBuildStep(plan);
  const setupSteps = renderSetupSteps(plan);
  const preferIpv4LocalhostStep = renderPreferIpv4LocalhostStep(plan);
  const waitUrl = `${plan.baseUrl.value.replace(/\/$/, '')}/`;
  const browserEnvLines = plan.playwrightVersion.value
    ? ['      PLAYWRIGHT_BROWSERS_PATH: /ms-playwright', '      PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: 1', ...plan.envYamlLines]
    : plan.envYamlLines;
  const browserStep = plan.playwrightVersion.value
    ? ''
    : `      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps
`;

  return `name: Features
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  features:
    runs-on: ubuntu-latest
${containerBlock}${serviceBlock}    env:
${browserEnvLines.join('\n')}
    steps:
      - uses: actions/checkout@v4
${plan.setupNodeBlock.join('\n')}
      - name: Install dependencies
        run: ${plan.installCommand}
${browserStep}      - name: Install wait-on
        run: npm i -g wait-on
${buildStep}${setupSteps}${todoComments}${preferIpv4LocalhostStep}${renderRunAndTestStep(plan, waitUrl)}
`;
}

export function installGithubAction(
  env: Pick<Environment, 'packageManager' | 'nodeVersion' | 'cwd'>,
  options: { appTarget?: DetectionResult<AppTarget>; overrides?: CiWorkflowPlanOverrides } = {},
): GithubActionsResult {
  const workflowDir = join(env.cwd, '.github', 'workflows');
  const workflowPath = join(workflowDir, 'letsrunit.yml');
  const plan = buildCiWorkflowPlan(env, { appTarget: options.appTarget, overrides: options.overrides });

  if (existsSync(workflowPath)) return { status: 'skipped', plan };

  mkdirSync(workflowDir, { recursive: true });
  writeFileSync(workflowPath, workflowYaml(plan), 'utf-8');
  return { status: 'created', plan };
}
