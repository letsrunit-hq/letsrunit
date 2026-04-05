import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/store.ts', 'src/progress.ts'],
  format: ['esm'],
  platform: 'node',
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  outDir: 'dist',
  noExternal: ['@letsrunit/store'],
  external: ['node-sqlite3-wasm'],
});
