import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildCiWorkflowPlan } from '../src/setup/ci-workflow-plan.js';
import type { PackageManager } from '../src/detect.js';

const dirs: string[] = [];

function makeDir(): string {
  const path = mkdtempSync(join(tmpdir(), 'letsrunit-ci-plan-'));
  dirs.push(path);
  return path;
}

function writePackageJson(cwd: string, data: object): void {
  writeFileSync(join(cwd, 'package.json'), JSON.stringify(data, null, 2), 'utf-8');
}

function planFor(cwd: string, packageManager: PackageManager = 'npm') {
  return buildCiWorkflowPlan({ cwd, packageManager, nodeVersion: 22 });
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('buildCiWorkflowPlan', () => {
  it('maps package manager install/run commands', () => {
    const cwd = makeDir();
    writePackageJson(cwd, { scripts: { start: 'node server.js' } });

    const npmPlan = planFor(cwd, 'npm');
    const yarnPlan = planFor(cwd, 'yarn');
    const pnpmPlan = planFor(cwd, 'pnpm');
    const bunPlan = planFor(cwd, 'bun');

    expect(npmPlan.installCommand).toBe('npm ci');
    expect(yarnPlan.installCommand).toBe('yarn install --immutable');
    expect(pnpmPlan.installCommand).toBe('pnpm install --frozen-lockfile');
    expect(bunPlan.installCommand).toBe('bun install --frozen-lockfile');

    expect(yarnPlan.startCommand.value).toBe('yarn start');
    expect(pnpmPlan.startCommand.value).toBe('pnpm start');
    expect(bunPlan.startCommand.value).toBe('bun run start');
  });

  it('uses start command precedence with low-confidence fallback', () => {
    const cwd = makeDir();
    writePackageJson(cwd, { scripts: { dev: 'vite' } });
    let plan = planFor(cwd);
    expect(plan.startCommand.value).toBe('npm run dev');
    expect(plan.startCommand.confidence).toBe('medium');

    writePackageJson(cwd, { scripts: {} });
    plan = planFor(cwd);
    expect(plan.startCommand.value).toBe('npm run dev');
    expect(plan.startCommand.confidence).toBe('low');
    expect(plan.todoNotes.join('\n')).toContain('verify start command');
  });

  it('uses provided app target for port and baseURL', () => {
    const cwd = makeDir();
    writePackageJson(cwd, { scripts: { start: 'node server.js' } });

    const plan = buildCiWorkflowPlan(
      { cwd, packageManager: 'npm', nodeVersion: 22 },
      {
        appTarget: {
          value: { framework: 'vite', port: 5173, baseUrl: 'http://localhost:5173' },
          confidence: 'high',
          evidence: ['dependency:vite'],
        },
      },
    );
    expect(plan.appPort.value).toBe(5173);
    expect(plan.baseUrl.value).toBe('http://localhost:5173');
    expect(plan.appPort.confidence).toBe('high');
  });

  it('detects supabase and postgres workflows', () => {
    const supabaseCwd = makeDir();
    writePackageJson(supabaseCwd, { scripts: { start: 'node server.js' } });
    mkdirSync(join(supabaseCwd, 'supabase'), { recursive: true });
    writeFileSync(join(supabaseCwd, 'supabase', 'config.toml'), 'project_id = "demo"', 'utf-8');

    const supabasePlan = planFor(supabaseCwd);
    expect(supabasePlan.db.value.service).toBe('supabase');
    expect(supabasePlan.setupSteps.join('\n')).toContain('supabase start');

    const postgresCwd = makeDir();
    writePackageJson(postgresCwd, {
      scripts: { start: 'node server.js', 'db:migrate': 'prisma migrate deploy' },
      dependencies: { pg: '^8.0.0' },
    });

    const postgresPlan = planFor(postgresCwd);
    expect(postgresPlan.db.value.service).toBe('postgres');
    expect(postgresPlan.serviceYamlLines.join('\n')).toContain('postgres:16');
    expect(postgresPlan.setupSteps.join('\n')).toContain('npm run db:migrate');
  });

  it('plans hosted Supabase through repository secrets', () => {
    const cwd = makeDir();
    writePackageJson(cwd, { scripts: { start: 'node server.js' } });

    const plan = buildCiWorkflowPlan(
      { cwd, packageManager: 'npm', nodeVersion: 22 },
      {
        overrides: {
          db: {
            value: {
              service: 'supabase',
              name: 'app_test',
              user: 'postgres',
              password: 'postgres',
              supabaseMode: 'hosted',
            },
            confidence: 'high',
            evidence: ['test'],
          },
        },
      },
    );

    expect(plan.serviceYamlLines.join('\n')).not.toContain('postgres:16');
    expect(plan.setupSteps.join('\n')).not.toContain('supabase start');
    expect(plan.envYamlLines.join('\n')).toContain('SUPABASE_URL: ${{ secrets.SUPABASE_URL }}');
    expect(plan.todoNotes.join('\n')).toContain('SUPABASE_URL and SUPABASE_ANON_KEY');
  });

  it('plans MySQL and MongoDB service containers with connection env', () => {
    const mysqlCwd = makeDir();
    writePackageJson(mysqlCwd, { scripts: { start: 'node server.js' }, dependencies: { mysql2: '^3.0.0' } });
    const mysqlPlan = planFor(mysqlCwd);
    expect(mysqlPlan.db.value.service).toBe('mysql');
    expect(mysqlPlan.serviceYamlLines.join('\n')).toContain('image: mysql:8');
    expect(mysqlPlan.envYamlLines.join('\n')).toContain('DATABASE_URL: mysql://root:mysql@127.0.0.1:3306/app_test');

    const mongoCwd = makeDir();
    writePackageJson(mongoCwd, { scripts: { start: 'node server.js' }, dependencies: { mongoose: '^8.0.0' } });
    const mongoPlan = planFor(mongoCwd);
    expect(mongoPlan.db.value.service).toBe('mongodb');
    expect(mongoPlan.serviceYamlLines.join('\n')).toContain('image: mongo:7');
    expect(mongoPlan.envYamlLines.join('\n')).toContain(
      'MONGODB_URI: mongodb://root:mongodb@127.0.0.1:27017/app_test?authSource=admin',
    );
  });

  it('keeps migration and seed commands as separate setup steps', () => {
    const cwd = makeDir();
    writePackageJson(cwd, {
      scripts: {
        start: 'node server.js',
        'db:migrate': 'prisma migrate deploy',
        'db:seed': 'tsx prisma/seed.ts',
      },
      dependencies: { pg: '^8.0.0' },
    });

    const plan = planFor(cwd);
    const setup = plan.setupSteps.join('\n');
    expect(setup).toContain('      - name: Run DB migrations\n        run: npm run db:migrate');
    expect(setup).toContain('      - name: Seed DB\n        run: npm run db:seed');
  });

  it('plans Mailpit, MailHog, and Testmail runtime settings', () => {
    const cwd = makeDir();
    writePackageJson(cwd, { scripts: { start: 'node server.js' } });

    const mailpit = buildCiWorkflowPlan(
      { cwd, packageManager: 'npm', nodeVersion: 22 },
      {
        overrides: {
          mail: {
            value: { service: 'mailpit', mailpitBaseUrl: 'http://localhost:8025' },
            confidence: 'high',
            evidence: ['test'],
          },
        },
      },
    );
    expect(mailpit.serviceYamlLines.join('\n')).toContain('image: axllent/mailpit');
    expect(mailpit.envYamlLines.join('\n')).toContain('LETSRUNIT_MAILBOX_SERVICE: mailpit');

    const mailhog = buildCiWorkflowPlan(
      { cwd, packageManager: 'npm', nodeVersion: 22 },
      {
        overrides: {
          mail: {
            value: { service: 'mailhog', mailhogBaseUrl: 'http://localhost:8025' },
            confidence: 'high',
            evidence: ['test'],
          },
        },
      },
    );
    expect(mailhog.serviceYamlLines.join('\n')).toContain('image: mailhog/mailhog');
    expect(mailhog.envYamlLines.join('\n')).toContain('LETSRUNIT_MAILBOX_SERVICE: mailhog');

    const testmail = buildCiWorkflowPlan(
      { cwd, packageManager: 'npm', nodeVersion: 22 },
      {
        overrides: {
          mail: {
            value: { service: 'testmail', testmailDomain: 'inbox.testmail.app' },
            confidence: 'high',
            evidence: ['test'],
          },
        },
      },
    );
    expect(testmail.serviceYamlLines).toEqual([]);
    expect(testmail.envYamlLines.join('\n')).toContain(
      'LETSRUNIT_TESTMAIL_API_KEY: ${{ secrets.LETSRUNIT_TESTMAIL_API_KEY }}',
    );
    expect(testmail.envYamlLines.join('\n')).toContain(
      'LETSRUNIT_TESTMAIL_NAMESPACE: ${{ secrets.LETSRUNIT_TESTMAIL_NAMESPACE }}',
    );
  });
});
