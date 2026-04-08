import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'node',
  shims: true,
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  outDir: 'dist',
  banner: {
    js: "#!/usr/bin/env node\nimport * as __m from 'node:module'; const require = __m.createRequire(import.meta.url);",
  },
});
