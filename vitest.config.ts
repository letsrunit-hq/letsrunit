import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'packages/*/vitest.config.ts',
    ],
    coverage: {
      exclude: [
        // Barrel re-exports — no executable statements of their own
        'packages/playwright/src/index.ts',
        'packages/playwright/src/selector/index.ts',
        // Type-only files — only interface/type declarations, zero runtime code
        'packages/playwright/src/types.ts',
        'packages/playwright/src/field/types.ts',
      ],
    },
  },
});
