import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Environment } from '../detect.js';
import { buildCiWorkflowPlan, type CiWorkflowPlan } from './ci-workflow-plan.js';
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

function renderDbSteps(plan: CiWorkflowPlan): string {
  if (plan.dbSetupSteps.length === 0) return '';
  return `${plan.dbSetupSteps.join('\n')}\n`;
}

function workflowYaml(plan: CiWorkflowPlan): string {
  const setupSteps = plan.setupNodeBlock.join('\n');
  const serviceBlock = renderServiceBlock(plan);
  const todoComments = renderTodoComments(plan);
  const buildStep = renderBuildStep(plan);
  const dbSteps = renderDbSteps(plan);
  const waitUrl = `${plan.baseUrl.value.replace(/\/$/, '')}/`;

  return `name: Features
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  features:
    runs-on: ubuntu-latest
${serviceBlock}    env:
      BASE_URL: ${plan.baseUrl.value}
    steps:
      - uses: actions/checkout@v4
${setupSteps}
      - name: Install dependencies
        run: ${plan.installCommand}
      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps
      - name: Install wait-on
        run: npm i -g wait-on
${buildStep}${dbSteps}${todoComments}      - name: Start app
        run: ${plan.startCommand.value} &
      - name: Wait for app
        run: wait-on ${waitUrl}
      - name: Run features
        run: ${plan.runCucumberCommand}
`;
}

export function installGithubAction(
  env: Pick<Environment, 'packageManager' | 'nodeVersion' | 'cwd'>,
  options: { appTarget?: DetectionResult<AppTarget> } = {},
): GithubActionsResult {
  const workflowDir = join(env.cwd, '.github', 'workflows');
  const workflowPath = join(workflowDir, 'letsrunit.yml');
  const plan = buildCiWorkflowPlan(env, { appTarget: options.appTarget });

  if (existsSync(workflowPath)) return { status: 'skipped', plan };

  mkdirSync(workflowDir, { recursive: true });
  writeFileSync(workflowPath, workflowYaml(plan), 'utf-8');
  return { status: 'created', plan };
}
