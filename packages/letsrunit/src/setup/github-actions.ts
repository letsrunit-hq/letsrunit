import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PackageManager } from '../detect.js';

function workflowYaml(pm: PackageManager): string {
  const setupSteps =
    pm === 'yarn'
      ? `      - name: Enable Corepack
        run: corepack enable
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: yarn
      - name: Install dependencies
        run: yarn install --immutable`
      : pm === 'pnpm'
        ? `      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - name: Install dependencies
        run: pnpm install --frozen-lockfile`
        : pm === 'bun'
          ? `      - uses: oven-sh/setup-bun@v2
      - name: Install dependencies
        run: bun install --frozen-lockfile`
          : `      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - name: Install dependencies
        run: npm ci`;

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

export type GithubActionsResult = 'created' | 'skipped';

export function installGithubAction(pm: PackageManager, cwd: string): GithubActionsResult {
  const workflowDir = join(cwd, '.github', 'workflows');
  const workflowPath = join(workflowDir, 'letsrunit.yml');

  if (existsSync(workflowPath)) return 'skipped';

  mkdirSync(workflowDir, { recursive: true });
  writeFileSync(workflowPath, workflowYaml(pm), 'utf-8');
  return 'created';
}
