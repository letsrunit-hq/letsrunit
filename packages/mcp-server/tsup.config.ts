import { defineConfig } from 'tsup';
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string };

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'node',
  skipNodeModulesBundle: true,
  external: ['@letsrunit/bdd'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  outDir: 'dist',
  define: {
    __LETSRUNIT_VERSION__: JSON.stringify(version),
  },
  banner: {
    js: "#!/usr/bin/env node\nimport * as __m from 'node:module'; const require = __m.createRequire(import.meta.url);",
  },
});
