import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Environment, PackageManager } from '../detect.js';
import { detectAppTarget, type DetectionResult as ProjectDetectionResult } from './project-app.js';

export type DetectionResult<T> = ProjectDetectionResult<T>;

export interface CiWorkflowPlan {
  nodeVersion: number;
  packageManager: PackageManager;
  installCommand: string;
  runCucumberCommand: string;
  setupNodeBlock: string[];
  startCommand: DetectionResult<string>;
  buildCommand: DetectionResult<string | null>;
  baseUrl: DetectionResult<string>;
  appPort: DetectionResult<number>;
  db: DetectionResult<'none' | 'supabase' | 'postgres'>;
  migrationCommand: DetectionResult<string | null>;
  todoNotes: string[];
  serviceYamlLines: string[];
  dbSetupSteps: string[];
}

interface PackageJson {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const DEFAULT_BASE_URL = 'http://localhost:3000';

function readPackageJson(cwd: string): PackageJson {
  const pkgPath = join(cwd, 'package.json');
  if (!existsSync(pkgPath)) return {};
  try {
    return JSON.parse(readFileSync(pkgPath, 'utf-8')) as PackageJson;
  } catch {
    return {};
  }
}

function pmRun(pm: PackageManager, script: string): string {
  if (pm === 'npm') return `npm run ${script}`;
  if (pm === 'yarn') return `yarn ${script}`;
  if (pm === 'pnpm') return `pnpm ${script}`;
  return `bun run ${script}`;
}

function setupNodeBlock(pm: PackageManager, nodeVersion: number): { setupNode: string[]; install: string } {
  if (pm === 'yarn') {
    return {
      setupNode: [
        '      - name: Enable Corepack',
        '        run: corepack enable',
        '      - uses: actions/setup-node@v4',
        '        with:',
        `          node-version: ${nodeVersion}`,
        '          cache: yarn',
      ],
      install: 'yarn install --immutable',
    };
  }

  if (pm === 'pnpm') {
    return {
      setupNode: [
        '      - uses: pnpm/action-setup@v4',
        '      - uses: actions/setup-node@v4',
        '        with:',
        `          node-version: ${nodeVersion}`,
        '          cache: pnpm',
      ],
      install: 'pnpm install --frozen-lockfile',
    };
  }

  if (pm === 'bun') {
    return {
      setupNode: [
        '      - uses: oven-sh/setup-bun@v2',
      ],
      install: 'bun install --frozen-lockfile',
    };
  }

  return {
    setupNode: [
      '      - uses: actions/setup-node@v4',
      '        with:',
      `          node-version: ${nodeVersion}`,
      '          cache: npm',
    ],
    install: 'npm ci',
  };
}

function inferStartCommand(pm: PackageManager, pkg: PackageJson): DetectionResult<string> {
  const scripts = pkg.scripts ?? {};
  const ordered = ['start:ci', 'start', 'dev', 'serve', 'preview'];

  for (const name of ordered) {
    if (scripts[name]) {
      const confidence = name === 'start:ci' || name === 'start' ? 'high' : 'medium';
      return { value: pmRun(pm, name), confidence, evidence: [`package.json#scripts.${name}`] };
    }
  }

  return {
    value: pmRun(pm, 'dev'),
    confidence: 'low',
    evidence: ['no start-like scripts detected'],
  };
}

function inferBuildCommand(pm: PackageManager, pkg: PackageJson): DetectionResult<string | null> {
  const scripts = pkg.scripts ?? {};
  if (scripts.build) {
    return { value: pmRun(pm, 'build'), confidence: 'high', evidence: ['package.json#scripts.build'] };
  }

  return { value: null, confidence: 'low', evidence: ['no build script detected'] };
}

function hasAnyDep(pkg: PackageJson, names: string[]): boolean {
  const deps = pkg.dependencies ?? {};
  const devDeps = pkg.devDependencies ?? {};
  for (const name of names) {
    if (name in deps || name in devDeps) return true;
  }
  return false;
}

function inferMigrationCommand(pm: PackageManager, pkg: PackageJson): DetectionResult<string | null> {
  const scripts = pkg.scripts ?? {};
  const ordered = ['db:migrate', 'migrate', 'migrations:run', 'prisma:migrate'];
  for (const script of ordered) {
    if (scripts[script]) {
      return { value: pmRun(pm, script), confidence: 'high', evidence: [`package.json#scripts.${script}`] };
    }
  }

  return { value: null, confidence: 'low', evidence: ['no migration script detected'] };
}

function inferDb(cwd: string, pkg: PackageJson): DetectionResult<'none' | 'supabase' | 'postgres'> {
  const hasSupabaseDir = existsSync(join(cwd, 'supabase'));
  const hasSupabaseConfig = existsSync(join(cwd, 'supabase', 'config.toml'));
  const hasSupabaseDep = hasAnyDep(pkg, ['supabase', '@supabase/supabase-js']);
  if (hasSupabaseDir || hasSupabaseConfig || hasSupabaseDep) {
    return {
      value: 'supabase',
      confidence: hasSupabaseConfig ? 'high' : 'medium',
      evidence: [
        ...(hasSupabaseDir ? ['supabase/'] : []),
        ...(hasSupabaseConfig ? ['supabase/config.toml'] : []),
        ...(hasSupabaseDep ? ['supabase dependency'] : []),
      ],
    };
  }

  const hasPg = hasAnyDep(pkg, ['pg', 'postgres', 'typeorm', 'prisma']);
  if (hasPg) {
    return { value: 'postgres', confidence: 'medium', evidence: ['postgres-related dependency'] };
  }

  return { value: 'none', confidence: 'low', evidence: ['no db signals detected'] };
}

export function buildCiWorkflowPlan(
  env: Pick<Environment, 'cwd' | 'packageManager' | 'nodeVersion'>,
  options: { appTarget?: ProjectDetectionResult<{ framework: string; port: number; baseUrl: string }> } = {},
): CiWorkflowPlan {
  const pkg = readPackageJson(env.cwd);
  const setup = setupNodeBlock(env.packageManager, env.nodeVersion);
  const startCommand = inferStartCommand(env.packageManager, pkg);
  const buildCommand = inferBuildCommand(env.packageManager, pkg);
  const appTarget = options.appTarget ?? detectAppTarget(env.cwd);
  const appPort: DetectionResult<number> = {
    value: appTarget.value.port,
    confidence: appTarget.confidence,
    evidence: [...appTarget.evidence],
  };
  const baseUrl: DetectionResult<string> = {
    value: appTarget.value.baseUrl,
    confidence: appTarget.confidence,
    evidence: [...appTarget.evidence],
  };
  const db = inferDb(env.cwd, pkg);
  const migrationCommand = inferMigrationCommand(env.packageManager, pkg);

  const todoNotes: string[] = [];
  if (startCommand.confidence === 'low') {
    todoNotes.push('TODO: verify start command (defaulted to dev script).');
  }
  if (appPort.confidence === 'low') {
    todoNotes.push('TODO: verify application port and baseURL.');
  }
  if (db.value === 'none') {
    todoNotes.push('TODO: add DB setup steps if your tests need one.');
  }

  const serviceYamlLines: string[] = [];
  const dbSetupSteps: string[] = [];

  if (db.value === 'supabase') {
    dbSetupSteps.push('      - uses: supabase/setup-cli@v1');
    dbSetupSteps.push('      - name: Start Supabase');
    dbSetupSteps.push('        run: supabase start');
    dbSetupSteps.push('      - name: Apply Supabase migrations');
    dbSetupSteps.push('        run: supabase db push');
  }

  if (db.value === 'postgres') {
    serviceYamlLines.push('    services:');
    serviceYamlLines.push('      postgres:');
    serviceYamlLines.push('        image: postgres:16');
    serviceYamlLines.push('        env:');
    serviceYamlLines.push('          POSTGRES_USER: postgres');
    serviceYamlLines.push('          POSTGRES_PASSWORD: postgres');
    serviceYamlLines.push('          POSTGRES_DB: app');
    serviceYamlLines.push('        ports:');
    serviceYamlLines.push('          - 5432:5432');
    serviceYamlLines.push('        options: >-');
    serviceYamlLines.push('          --health-cmd "pg_isready -U postgres"');
    serviceYamlLines.push('          --health-interval 10s');
    serviceYamlLines.push('          --health-timeout 5s');
    serviceYamlLines.push('          --health-retries 5');

    if (migrationCommand.value) {
      dbSetupSteps.push('      - name: Run DB migrations');
      dbSetupSteps.push(`        run: ${migrationCommand.value}`);
    } else {
      todoNotes.push('TODO: add migration step for Postgres.');
    }
  }

  return {
    nodeVersion: env.nodeVersion,
    packageManager: env.packageManager,
    installCommand: setup.install,
    runCucumberCommand: 'npx cucumber-js',
    setupNodeBlock: setup.setupNode,
    startCommand,
    buildCommand,
    baseUrl,
    appPort,
    db,
    migrationCommand,
    todoNotes,
    serviceYamlLines,
    dbSetupSteps,
  };
}

export function updateCucumberBaseUrl(cwd: string, targetUrl: string): 'updated' | 'skipped' {
  const configPath = join(cwd, 'cucumber.js');
  if (!existsSync(configPath)) return 'skipped';

  const current = readFileSync(configPath, 'utf-8');
  const match = current.match(/(baseURL\s*:\s*['"])([^'"]+)(['"])/);
  if (!match) return 'skipped';
  if (match[2] === targetUrl) return 'skipped';

  const next = current.replace(/(baseURL\s*:\s*['"])([^'"]+)(['"])/, `$1${targetUrl}$3`);
  if (next === current) return 'skipped';

  // Keep this update narrowly scoped to baseURL replacement.
  writeFileSync(configPath, next, 'utf-8');

  return 'updated';
}

export function recommendedBaseUrl(plan: CiWorkflowPlan): string {
  return plan.baseUrl.value || DEFAULT_BASE_URL;
}
