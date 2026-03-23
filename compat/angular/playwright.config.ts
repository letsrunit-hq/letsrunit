import { defineConfig } from '@sand4rt/experimental-ct-angular';

export default defineConfig({
  testDir: './tests',

  timeout: 30_000,

  use: {
    viewport: { width: 1280, height: 800 },
    ctViteConfig: { resolve: { conditions: ['style'] }, esbuild: { target: 'es2022' } },
  },

  expect: {
    timeout: 1_000,
  },
});
