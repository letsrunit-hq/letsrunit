import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildCiWorkflowPlan, updateCucumberBaseUrl } from '../src/setup/ci-workflow-plan.js';
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
    expect(supabasePlan.db.value).toBe('supabase');
    expect(supabasePlan.dbSetupSteps.join('\n')).toContain('supabase start');

    const postgresCwd = makeDir();
    writePackageJson(postgresCwd, {
      scripts: { start: 'node server.js', 'db:migrate': 'prisma migrate deploy' },
      dependencies: { pg: '^8.0.0' },
    });

    const postgresPlan = planFor(postgresCwd);
    expect(postgresPlan.db.value).toBe('postgres');
    expect(postgresPlan.serviceYamlLines.join('\n')).toContain('postgres:16');
    expect(postgresPlan.dbSetupSteps.join('\n')).toContain('npm run db:migrate');
  });
});

describe('updateCucumberBaseUrl', () => {
  it('updates existing baseURL value', () => {
    const cwd = makeDir();
    writeFileSync(
      join(cwd, 'cucumber.js'),
      "export default { worldParameters: { baseURL: 'http://localhost:3000' } };",
      'utf-8',
    );

    expect(updateCucumberBaseUrl(cwd, 'http://localhost:4100')).toBe('updated');
    expect(readFileSync(join(cwd, 'cucumber.js'), 'utf-8')).toContain('http://localhost:4100');
  });
});
