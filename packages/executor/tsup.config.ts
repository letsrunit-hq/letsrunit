import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'node',
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  outDir: 'dist',
  external: ['jsdom'],
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url); const __filename = new URL(import.meta.url).pathname; const __dirname = __filename.substring(0, __filename.lastIndexOf('/'));",
  },
});
