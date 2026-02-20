import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Environment } from '../detect.js';

export type GithubActionsResult = 'created' | 'skipped';

function setupStepsFor({ packageManager, nodeVersion }: Pick<Environment, 'packageManager' | 'nodeVersion'>): string {
  if (packageManager === 'yarn') return `\
      - name: Enable Corepack
        run: corepack enable
      - uses: actions/setup-node@v4
        with:
          node-version: ${nodeVersion}
          cache: yarn
      - name: Install dependencies
        run: yarn install --immutable`;
  if (packageManager === 'pnpm') return `\
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${nodeVersion}
          cache: pnpm
      - name: Install dependencies
        run: pnpm install --frozen-lockfile`;
  if (packageManager === 'bun') return `\
      - uses: oven-sh/setup-bun@v2
      - name: Install dependencies
        run: bun install --frozen-lockfile`;
  return `\
      - uses: actions/setup-node@v4
        with:
          node-version: ${nodeVersion}
          cache: npm
      - name: Install dependencies
        run: npm ci`;
}

function workflowYaml(env: Pick<Environment, 'packageManager' | 'nodeVersion'>): string {
  const setupSteps = setupStepsFor(env);

  return `name: Features
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  features:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
${setupSteps}
      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps
      - name: Run features
        run: npx cucumber-js
`;
}

export function installGithubAction(env: Pick<Environment, 'packageManager' | 'nodeVersion' | 'cwd'>): GithubActionsResult {
  const workflowDir = join(env.cwd, '.github', 'workflows');
  const workflowPath = join(workflowDir, 'letsrunit.yml');

  if (existsSync(workflowPath)) return 'skipped';

  mkdirSync(workflowDir, { recursive: true });
  writeFileSync(workflowPath, workflowYaml(env), 'utf-8');
  return 'created';
}
