// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['cjs'],
  splitting: false,
  platform: 'node',
  target: 'node22',
  outExtension: () => ({ js: '.cjs' }),

  noExternal: [/^@letsrunit\//],
  external: ['playwright', 'playwright-core', 'chromium-bidi', 'jsdom'],
});
