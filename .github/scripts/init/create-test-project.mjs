import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TAR_FILES = [
  'letsrunit.tgz',
  'ai.tgz',
  'bdd.tgz',
  'cucumber.tgz',
  'cli.tgz',
  'controller.tgz',
  'executor.tgz',
  'gherker.tgz',
  'gherkin.tgz',
  'journal.tgz',
  'mailbox.tgz',
  'playwright.tgz',
  'store.tgz',
  'utils.tgz',
];

const PLAYWRIGHT_VERSION = '1.58.2';

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const value = args[i + 1];
    result[key] = value;
    i += 1;
  }

  return result;
}

function main() {
  const args = parseArgs();
  const pm = args.pm;
  const targetDir = args['target-dir'];
  const tarballsDir = args['tarballs-dir'] ?? '/tmp';

  if (!pm || !targetDir) {
    throw new Error('Usage: node create-test-project.mjs --pm <npm|yarn|pnpm|bun> --target-dir <path> [--tarballs-dir <path>]');
  }

  mkdirSync(targetDir, { recursive: true });

  for (const tarName of TAR_FILES) {
    copyFileSync(resolve(tarballsDir, tarName), resolve(targetDir, tarName));
  }

  const localOverrides = {
    letsrunit: 'file:./letsrunit.tgz',
    '@letsrunit/ai': 'file:./ai.tgz',
    '@letsrunit/bdd': 'file:./bdd.tgz',
    '@letsrunit/cucumber': 'file:./cucumber.tgz',
    '@letsrunit/cli': 'file:./cli.tgz',
    '@letsrunit/controller': 'file:./controller.tgz',
    '@letsrunit/executor': 'file:./executor.tgz',
    '@letsrunit/gherker': 'file:./gherker.tgz',
    '@letsrunit/gherkin': 'file:./gherkin.tgz',
    '@letsrunit/journal': 'file:./journal.tgz',
    '@letsrunit/mailbox': 'file:./mailbox.tgz',
    '@letsrunit/playwright': 'file:./playwright.tgz',
    '@letsrunit/store': 'file:./store.tgz',
    '@letsrunit/utils': 'file:./utils.tgz',
  };

  const pkg = {
    name: 'test-project',
    version: '1.0.0',
    private: true,
    type: 'module',
    dependencies: {
      '@letsrunit/cli': 'file:./cli.tgz',
      '@letsrunit/cucumber': 'file:./cucumber.tgz',
      '@cucumber/cucumber': '*',
      playwright: PLAYWRIGHT_VERSION,
    },
  };

  if (pm === 'yarn') {
    pkg.packageManager = 'yarn@1.22.22';
    pkg.resolutions = localOverrides;
  } else if (pm === 'pnpm') {
    pkg.pnpm = { overrides: localOverrides };
  } else if (pm === 'npm' || pm === 'bun') {
    pkg.overrides = localOverrides;
  } else {
    throw new Error(`Unsupported package manager: ${pm}`);
  }

  writeFileSync(resolve(targetDir, 'package.json'), JSON.stringify(pkg, null, 2));
}

main();
