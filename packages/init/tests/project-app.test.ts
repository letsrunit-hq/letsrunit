import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { detectAppTarget, ensureLetsrunitIgnoredInVite } from '../src/setup/project-app.js';

const dirs: string[] = [];

function makeDir(): string {
  const path = mkdtempSync(join(tmpdir(), 'letsrunit-app-target-'));
  dirs.push(path);
  return path;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('detectAppTarget', () => {
  it('detects vite port from vite.config.ts', () => {
    const cwd = makeDir();
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ devDependencies: { vite: '^7.0.0' } }), 'utf-8');
    writeFileSync(join(cwd, 'vite.config.ts'), 'export default { server: { port: 6123 } };\n', 'utf-8');

    const result = detectAppTarget(cwd);
    expect(result.value.framework).toBe('vite');
    expect(result.value.port).toBe(6123);
  });

  it('detects angular port from angular.json', () => {
    const cwd = makeDir();
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ dependencies: { '@angular/core': '^20.0.0' } }), 'utf-8');
    writeFileSync(
      join(cwd, 'angular.json'),
      JSON.stringify(
        {
          defaultProject: 'app',
          projects: {
            app: {
              architect: {
                serve: {
                  options: {
                    port: 4300,
                  },
                },
              },
            },
          },
        },
        null,
        2,
      ),
      'utf-8',
    );

    const result = detectAppTarget(cwd);
    expect(result.value.framework).toBe('angular');
    expect(result.value.port).toBe(4300);
  });

  it('detects nuxt devServer port from nuxt.config.ts', () => {
    const cwd = makeDir();
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ dependencies: { nuxt: '^4.0.0' } }), 'utf-8');
    writeFileSync(
      join(cwd, 'nuxt.config.ts'),
      'export default defineNuxtConfig({ devServer: { port: 3456 } });',
      'utf-8',
    );

    const result = detectAppTarget(cwd);
    expect(result.value.framework).toBe('nuxt');
    expect(result.value.port).toBe(3456);
  });

  it('detects astro port from astro.config.mjs', () => {
    const cwd = makeDir();
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ dependencies: { astro: '^5.0.0' } }), 'utf-8');
    writeFileSync(join(cwd, 'astro.config.mjs'), 'export default { server: { port: 4567 } };', 'utf-8');

    const result = detectAppTarget(cwd);
    expect(result.value.framework).toBe('astro');
    expect(result.value.port).toBe(4567);
  });

  it('uses script port over framework config and env', () => {
    const cwd = makeDir();
    writeFileSync(
      join(cwd, 'package.json'),
      JSON.stringify({ devDependencies: { vite: '^7.0.0' }, scripts: { dev: 'vite --port 7777' } }),
      'utf-8',
    );
    writeFileSync(join(cwd, 'vite.config.ts'), 'export default { server: { port: 6123 } };', 'utf-8');
    writeFileSync(join(cwd, '.env'), 'PORT=9999\n', 'utf-8');

    const result = detectAppTarget(cwd);
    expect(result.value.port).toBe(7777);
    expect(result.evidence[0]).toContain('package.json#scripts.dev');
  });

  it('falls back to framework default when no explicit configuration exists', () => {
    const cwd = makeDir();
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ dependencies: { next: '^16.0.0' } }), 'utf-8');

    const result = detectAppTarget(cwd);
    expect(result.value.framework).toBe('nextjs');
    expect(result.value.port).toBe(3000);
  });
});

describe('ensureLetsrunitIgnoredInVite', () => {
  it('updates vite.config.ts to ignore .letsrunit', () => {
    const cwd = makeDir();
    writeFileSync(
      join(cwd, 'vite.config.ts'),
      ["import { defineConfig } from 'vite';", '', 'export default defineConfig({', '  plugins: [],', '});', ''].join(
        '\n',
      ),
      'utf-8',
    );

    expect(ensureLetsrunitIgnoredInVite(cwd)).toBe('updated');
    expect(readFileSync(join(cwd, 'vite.config.ts'), 'utf-8')).toContain("ignored: ['**/.letsrunit/**']");
  });

  it('falls back to vite.config.js when vite.config.ts does not exist', () => {
    const cwd = makeDir();
    writeFileSync(join(cwd, 'vite.config.js'), 'export default { server: { port: 6123 } };\n', 'utf-8');

    expect(ensureLetsrunitIgnoredInVite(cwd)).toBe('updated');
    expect(readFileSync(join(cwd, 'vite.config.js'), 'utf-8')).toContain("ignored: ['**/.letsrunit/**']");
  });

  it('adds letsrunit to an existing ignored array', () => {
    const cwd = makeDir();
    writeFileSync(
      join(cwd, 'vite.config.ts'),
      "export default { server: { watch: { ignored: ['**/tmp/**'] } } };\n",
      'utf-8',
    );

    expect(ensureLetsrunitIgnoredInVite(cwd)).toBe('updated');
    expect(readFileSync(join(cwd, 'vite.config.ts'), 'utf-8')).toContain("ignored: ['**/tmp/**', '**/.letsrunit/**']");
  });

  it('skips when vite config already ignores .letsrunit', () => {
    const cwd = makeDir();
    writeFileSync(
      join(cwd, 'vite.config.ts'),
      "export default { server: { watch: { ignored: ['**/.letsrunit/**'] } } };\n",
      'utf-8',
    );

    expect(ensureLetsrunitIgnoredInVite(cwd)).toBe('skipped');
  });
});
