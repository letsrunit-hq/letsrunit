import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Environment, PackageManager } from '../detect.js';
import { detectAppTarget, type DetectionResult as ProjectDetectionResult } from './project-app.js';

export type DetectionResult<T> = ProjectDetectionResult<T>;
export type CiDbService = 'none' | 'postgres' | 'supabase' | 'mysql' | 'mongodb';
export type SupabaseMode = 'local' | 'hosted';
export type CiMailService = 'none' | 'mailpit' | 'mailhog' | 'testmail';

export interface CiDbConfig {
  service: CiDbService;
  name: string;
  user: string;
  password: string;
  supabaseMode?: SupabaseMode;
}

export interface CiMailConfig {
  service: CiMailService;
  mailpitBaseUrl?: string;
  mailhogBaseUrl?: string;
  testmailDomain?: string;
}

export interface CiWorkflowPlanOverrides {
  startCommand?: DetectionResult<string>;
  buildCommand?: DetectionResult<string | null>;
  baseUrl?: DetectionResult<string>;
  db?: DetectionResult<CiDbConfig>;
  migrationCommand?: DetectionResult<string | null>;
  seedCommand?: DetectionResult<string | null>;
  mail?: DetectionResult<CiMailConfig>;
}

export interface CiWorkflowPlan {
  nodeVersion: number;
  packageManager: PackageManager;
  installCommand: string;
  runCucumberCommand: string;
  playwrightVersion: DetectionResult<string | null>;
  setupNodeBlock: string[];
  startCommand: DetectionResult<string>;
  buildCommand: DetectionResult<string | null>;
  baseUrl: DetectionResult<string>;
  appPort: DetectionResult<number>;
  db: DetectionResult<CiDbConfig>;
  migrationCommand: DetectionResult<string | null>;
  seedCommand: DetectionResult<string | null>;
  mail: DetectionResult<CiMailConfig>;
  todoNotes: string[];
  serviceYamlLines: string[];
  envYamlLines: string[];
  setupSteps: string[];
}

interface PackageJson {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const DEFAULT_BASE_URL = 'http://localhost:3000';
const DEFAULT_DB_NAME = 'app_test';
const DEFAULT_POSTGRES_USER = 'postgres';
const DEFAULT_POSTGRES_PASSWORD = 'postgres';
const DEFAULT_MYSQL_USER = 'root';
const DEFAULT_MYSQL_PASSWORD = 'mysql';
const DEFAULT_MONGO_USER = 'root';
const DEFAULT_MONGO_PASSWORD = 'mongodb';

function detected<T>(
  value: T,
  evidence: string[],
  confidence: DetectionResult<T>['confidence'] = 'medium',
): DetectionResult<T> {
  return { value, confidence, evidence };
}

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
      setupNode: ['      - uses: oven-sh/setup-bun@v2'],
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

function extractConcreteVersion(spec: string | undefined): string | null {
  if (!spec) return null;
  const match = spec.match(/\d+\.\d+\.\d+/);
  return match?.[0] ?? null;
}

function inferPlaywrightVersion(pkg: PackageJson): DetectionResult<string | null> {
  const deps = pkg.dependencies ?? {};
  const devDeps = pkg.devDependencies ?? {};
  const candidates = [
    ['@playwright/test', devDeps['@playwright/test'] ?? deps['@playwright/test']],
    ['playwright', devDeps.playwright ?? deps.playwright],
    [
      '@playwright/experimental-ct-react',
      devDeps['@playwright/experimental-ct-react'] ?? deps['@playwright/experimental-ct-react'],
    ],
  ] as const;

  for (const [name, spec] of candidates) {
    const version = extractConcreteVersion(spec);
    if (version) {
      return { value: version, confidence: 'high', evidence: [`${name}@${spec}`] };
    }
  }

  return { value: null, confidence: 'low', evidence: ['no Playwright version detected'] };
}

function inferScriptCommand(
  pm: PackageManager,
  pkg: PackageJson,
  scripts: string[],
  missingEvidence: string,
): DetectionResult<string | null> {
  const pkgScripts = pkg.scripts ?? {};
  for (const script of scripts) {
    if (pkgScripts[script]) {
      return { value: pmRun(pm, script), confidence: 'high', evidence: [`package.json#scripts.${script}`] };
    }
  }

  return { value: null, confidence: 'low', evidence: [missingEvidence] };
}

function inferDb(cwd: string, pkg: PackageJson): DetectionResult<CiDbConfig> {
  const hasSupabaseDir = existsSync(join(cwd, 'supabase'));
  const hasSupabaseConfig = existsSync(join(cwd, 'supabase', 'config.toml'));
  const hasSupabaseDep = hasAnyDep(pkg, ['supabase', '@supabase/supabase-js']);
  if (hasSupabaseDir || hasSupabaseConfig || hasSupabaseDep) {
    return {
      value: {
        service: 'supabase',
        name: DEFAULT_DB_NAME,
        user: DEFAULT_POSTGRES_USER,
        password: DEFAULT_POSTGRES_PASSWORD,
        supabaseMode: 'local',
      },
      confidence: hasSupabaseConfig ? 'high' : 'medium',
      evidence: [
        ...(hasSupabaseDir ? ['supabase/'] : []),
        ...(hasSupabaseConfig ? ['supabase/config.toml'] : []),
        ...(hasSupabaseDep ? ['supabase dependency'] : []),
      ],
    };
  }

  if (hasAnyDep(pkg, ['mysql', 'mysql2'])) {
    return dbDetection('mysql', 'medium', ['mysql-related dependency']);
  }

  if (hasAnyDep(pkg, ['mongodb', 'mongoose'])) {
    return dbDetection('mongodb', 'medium', ['mongodb-related dependency']);
  }

  if (hasAnyDep(pkg, ['pg', 'postgres', 'typeorm', 'prisma'])) {
    return dbDetection('postgres', 'medium', ['postgres-related dependency']);
  }

  return dbDetection('none', 'low', ['no db signals detected']);
}

function dbDetection(
  service: CiDbService,
  confidence: DetectionResult<CiDbConfig>['confidence'],
  evidence: string[],
): DetectionResult<CiDbConfig> {
  const defaults = dbDefaults(service);
  return { value: defaults, confidence, evidence };
}

export function dbDefaults(service: CiDbService): CiDbConfig {
  if (service === 'mysql') {
    return { service, name: DEFAULT_DB_NAME, user: DEFAULT_MYSQL_USER, password: DEFAULT_MYSQL_PASSWORD };
  }
  if (service === 'mongodb') {
    return { service, name: DEFAULT_DB_NAME, user: DEFAULT_MONGO_USER, password: DEFAULT_MONGO_PASSWORD };
  }
  if (service === 'supabase') {
    return {
      service,
      name: DEFAULT_DB_NAME,
      user: DEFAULT_POSTGRES_USER,
      password: DEFAULT_POSTGRES_PASSWORD,
      supabaseMode: 'local',
    };
  }
  if (service === 'postgres') {
    return { service, name: DEFAULT_DB_NAME, user: DEFAULT_POSTGRES_USER, password: DEFAULT_POSTGRES_PASSWORD };
  }
  return { service: 'none', name: DEFAULT_DB_NAME, user: '', password: '' };
}

function inferMail(): DetectionResult<CiMailConfig> {
  const service = process.env.LETSRUNIT_MAILBOX_SERVICE;
  if (service === 'mailpit') {
    return detected(
      { service, mailpitBaseUrl: process.env.LETSRUNIT_MAILPIT_BASE_URL ?? 'http://localhost:8025' },
      ['LETSRUNIT_MAILBOX_SERVICE'],
      'high',
    );
  }
  if (service === 'mailhog') {
    return detected(
      { service, mailhogBaseUrl: process.env.LETSRUNIT_MAILHOG_BASE_URL ?? 'http://localhost:8025' },
      ['LETSRUNIT_MAILBOX_SERVICE'],
      'high',
    );
  }
  if (service === 'testmail') {
    return detected(
      { service, testmailDomain: process.env.LETSRUNIT_MAILBOX_DOMAIN ?? 'inbox.testmail.app' },
      ['LETSRUNIT_MAILBOX_SERVICE'],
      'high',
    );
  }
  return detected({ service: 'none' }, ['no letsrunit mailbox env detected'], 'low');
}

function yamlEnvValue(value: string): string {
  if (value.includes('${{')) return value;
  if (/^[A-Za-z0-9._:/?&=+@-]+$/.test(value)) return value;
  return JSON.stringify(value);
}

function addDbService(
  plan: {
    serviceChildren: string[];
    env: Map<string, string>;
    setupSteps: string[];
    todoNotes: string[];
  },
  db: CiDbConfig,
  migrationCommand: string | null,
  seedCommand: string | null,
): void {
  if (db.service === 'none') {
    plan.todoNotes.push('TODO: add DB setup steps if your tests need one.');
    return;
  }

  if (db.service === 'supabase' && db.supabaseMode === 'hosted') {
    plan.env.set('SUPABASE_URL', '${{ secrets.SUPABASE_URL }}');
    plan.env.set('SUPABASE_ANON_KEY', '${{ secrets.SUPABASE_ANON_KEY }}');
    plan.todoNotes.push('TODO: add SUPABASE_URL and SUPABASE_ANON_KEY repository secrets.');
  } else if (db.service === 'supabase') {
    plan.env.set('SUPABASE_URL', 'http://localhost:54321');
    plan.env.set('SUPABASE_ANON_KEY', '${{ secrets.SUPABASE_ANON_KEY }}');
    plan.setupSteps.push('      - uses: supabase/setup-cli@v1');
    plan.setupSteps.push('      - name: Start Supabase');
    plan.setupSteps.push('        run: supabase start');
    plan.setupSteps.push('      - name: Apply Supabase migrations');
    plan.setupSteps.push('        run: supabase db push');
  } else if (db.service === 'postgres') {
    plan.env.set('DATABASE_URL', `postgresql://${db.user}:${db.password}@localhost:5432/${db.name}`);
    plan.env.set('PGDATABASE', db.name);
    plan.env.set('PGUSER', db.user);
    plan.env.set('PGPASSWORD', db.password);
    plan.serviceChildren.push('      postgres:');
    plan.serviceChildren.push('        image: postgres:16');
    plan.serviceChildren.push('        env:');
    plan.serviceChildren.push(`          POSTGRES_USER: ${db.user}`);
    plan.serviceChildren.push(`          POSTGRES_PASSWORD: ${db.password}`);
    plan.serviceChildren.push(`          POSTGRES_DB: ${db.name}`);
    plan.serviceChildren.push('        ports:');
    plan.serviceChildren.push('          - 5432:5432');
    plan.serviceChildren.push('        options: >-');
    plan.serviceChildren.push(`          --health-cmd "pg_isready -U ${db.user}"`);
    plan.serviceChildren.push('          --health-interval 10s');
    plan.serviceChildren.push('          --health-timeout 5s');
    plan.serviceChildren.push('          --health-retries 5');
  } else if (db.service === 'mysql') {
    plan.env.set('DATABASE_URL', `mysql://${db.user}:${db.password}@127.0.0.1:3306/${db.name}`);
    plan.env.set('MYSQL_DATABASE', db.name);
    plan.env.set('MYSQL_USER', db.user);
    plan.env.set('MYSQL_PASSWORD', db.password);
    plan.serviceChildren.push('      mysql:');
    plan.serviceChildren.push('        image: mysql:8');
    plan.serviceChildren.push('        env:');
    plan.serviceChildren.push(`          MYSQL_DATABASE: ${db.name}`);
    plan.serviceChildren.push(`          MYSQL_ROOT_PASSWORD: ${db.password}`);
    plan.serviceChildren.push('        ports:');
    plan.serviceChildren.push('          - 3306:3306');
    plan.serviceChildren.push('        options: >-');
    plan.serviceChildren.push('          --health-cmd "mysqladmin ping -h localhost"');
    plan.serviceChildren.push('          --health-interval 10s');
    plan.serviceChildren.push('          --health-timeout 5s');
    plan.serviceChildren.push('          --health-retries 5');
  } else if (db.service === 'mongodb') {
    plan.env.set('MONGODB_URI', `mongodb://${db.user}:${db.password}@127.0.0.1:27017/${db.name}?authSource=admin`);
    plan.serviceChildren.push('      mongodb:');
    plan.serviceChildren.push('        image: mongo:7');
    plan.serviceChildren.push('        env:');
    plan.serviceChildren.push(`          MONGO_INITDB_ROOT_USERNAME: ${db.user}`);
    plan.serviceChildren.push(`          MONGO_INITDB_ROOT_PASSWORD: ${db.password}`);
    plan.serviceChildren.push('        ports:');
    plan.serviceChildren.push('          - 27017:27017');
  }

  if (migrationCommand) {
    plan.setupSteps.push('      - name: Run DB migrations');
    plan.setupSteps.push(`        run: ${migrationCommand}`);
  } else if (db.service !== 'supabase') {
    plan.todoNotes.push(`TODO: add migration step for ${db.service}.`);
  }

  if (seedCommand) {
    plan.setupSteps.push('      - name: Seed DB');
    plan.setupSteps.push(`        run: ${seedCommand}`);
  }
}

function addMailService(
  plan: { serviceChildren: string[]; env: Map<string, string>; todoNotes: string[] },
  mail: CiMailConfig,
): void {
  if (mail.service === 'none') return;

  plan.env.set('LETSRUNIT_MAILBOX_SERVICE', mail.service);
  if (mail.service === 'mailpit') {
    plan.env.set('LETSRUNIT_MAILPIT_BASE_URL', mail.mailpitBaseUrl ?? 'http://localhost:8025');
    plan.serviceChildren.push('      mailpit:');
    plan.serviceChildren.push('        image: axllent/mailpit');
    plan.serviceChildren.push('        ports:');
    plan.serviceChildren.push('          - 8025:8025');
    plan.serviceChildren.push('          - 1025:1025');
    plan.todoNotes.push('TODO: configure your app SMTP settings for Mailpit in CI.');
  } else if (mail.service === 'mailhog') {
    plan.env.set('LETSRUNIT_MAILHOG_BASE_URL', mail.mailhogBaseUrl ?? 'http://localhost:8025');
    plan.serviceChildren.push('      mailhog:');
    plan.serviceChildren.push('        image: mailhog/mailhog');
    plan.serviceChildren.push('        ports:');
    plan.serviceChildren.push('          - 8025:8025');
    plan.serviceChildren.push('          - 1025:1025');
    plan.todoNotes.push('TODO: configure your app SMTP settings for MailHog in CI.');
  } else if (mail.service === 'testmail') {
    plan.env.set('LETSRUNIT_TESTMAIL_API_KEY', '${{ secrets.LETSRUNIT_TESTMAIL_API_KEY }}');
    plan.env.set('LETSRUNIT_TESTMAIL_NAMESPACE', '${{ secrets.LETSRUNIT_TESTMAIL_NAMESPACE }}');
    plan.env.set('LETSRUNIT_MAILBOX_DOMAIN', mail.testmailDomain ?? 'inbox.testmail.app');
    plan.todoNotes.push('TODO: add LETSRUNIT_TESTMAIL_API_KEY and LETSRUNIT_TESTMAIL_NAMESPACE repository secrets.');
  }
}

export function buildCiWorkflowPlan(
  env: Pick<Environment, 'cwd' | 'packageManager' | 'nodeVersion'>,
  options: {
    appTarget?: ProjectDetectionResult<{ framework: string; port: number; baseUrl: string }>;
    overrides?: CiWorkflowPlanOverrides;
  } = {},
): CiWorkflowPlan {
  const pkg = readPackageJson(env.cwd);
  const setup = setupNodeBlock(env.packageManager, env.nodeVersion);
  const appTarget = options.appTarget ?? detectAppTarget(env.cwd);
  const appPort: DetectionResult<number> = {
    value: appTarget.value.port,
    confidence: appTarget.confidence,
    evidence: [...appTarget.evidence],
  };
  const baseUrl = options.overrides?.baseUrl ?? {
    value: appTarget.value.baseUrl,
    confidence: appTarget.confidence,
    evidence: [...appTarget.evidence],
  };
  const startCommand = options.overrides?.startCommand ?? inferStartCommand(env.packageManager, pkg);
  const buildCommand = options.overrides?.buildCommand ?? inferBuildCommand(env.packageManager, pkg);
  const playwrightVersion = inferPlaywrightVersion(pkg);
  const db = options.overrides?.db ?? inferDb(env.cwd, pkg);
  const migrationCommand =
    options.overrides?.migrationCommand ??
    inferScriptCommand(
      env.packageManager,
      pkg,
      ['db:migrate', 'migrate', 'migrations:run', 'prisma:migrate'],
      'no migration script detected',
    );
  const seedCommand =
    options.overrides?.seedCommand ??
    inferScriptCommand(env.packageManager, pkg, ['db:seed', 'seed', 'prisma:seed'], 'no seed script detected');
  const mail = options.overrides?.mail ?? inferMail();

  const todoNotes: string[] = [];
  const serviceChildren: string[] = [];
  const envMap = new Map<string, string>([['LETSRUNIT_BASE_URL', baseUrl.value || DEFAULT_BASE_URL]]);
  const setupSteps: string[] = [];

  if (startCommand.confidence === 'low') {
    todoNotes.push('TODO: verify start command (defaulted to dev script).');
  }
  if (appPort.confidence === 'low' || baseUrl.confidence === 'low') {
    todoNotes.push('TODO: verify application port and baseURL.');
  }

  addDbService(
    { serviceChildren, env: envMap, setupSteps, todoNotes },
    db.value,
    migrationCommand.value,
    seedCommand.value,
  );
  addMailService({ serviceChildren, env: envMap, todoNotes }, mail.value);

  const serviceYamlLines = serviceChildren.length > 0 ? ['    services:', ...serviceChildren] : [];
  const envYamlLines = Array.from(envMap.entries()).map(([key, value]) => `      ${key}: ${yamlEnvValue(value)}`);

  return {
    nodeVersion: env.nodeVersion,
    packageManager: env.packageManager,
    installCommand: setup.install,
    runCucumberCommand: 'npx cucumber-js',
    playwrightVersion,
    setupNodeBlock: setup.setupNode,
    startCommand,
    buildCommand,
    baseUrl,
    appPort,
    db,
    migrationCommand,
    seedCommand,
    mail,
    todoNotes,
    serviceYamlLines,
    envYamlLines,
    setupSteps,
  };
}

export function recommendedBaseUrl(plan: CiWorkflowPlan): string {
  return plan.baseUrl.value || DEFAULT_BASE_URL;
}
