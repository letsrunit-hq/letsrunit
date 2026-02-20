import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/define.ts'],
  format: ['esm'],
  platform: 'node',
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  outDir: 'dist',
});
