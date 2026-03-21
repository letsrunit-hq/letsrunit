import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'packages/*/vitest.config.ts',
    ],
    coverage: {
      exclude: [
        '**/tests/**',
        'packages/playwright/src/translations/**',
        // Barrel re-exports — no executable statements of their own
        'packages/ai/src/index.ts',
        'packages/bdd/src/index.ts',
        'packages/controller/src/index.ts',
        'packages/controller/src/runner/index.ts',
        'packages/executor/src/index.ts',
        'packages/executor/src/types/index.ts',
        'packages/gherker/src/index.ts',
        'packages/gherkin/src/index.ts',
        'packages/gherkin/src/locator/index.ts',
        'packages/journal/src/index.ts',
        'packages/journal/src/sink/index.ts',
        'packages/letsrunit/src/index.ts',
        'packages/mailbox/src/index.ts',
        'packages/mcp-server/src/tools/index.ts',
        'packages/playwright/src/index.ts',
        'packages/playwright/src/selector/index.ts',
        'packages/store/src/index.ts',
        'packages/utils/src/index.ts',
        // Type-only files — only interface/type declarations, zero runtime code
        'packages/playwright/src/types.ts',
        'packages/playwright/src/field/types.ts',
      ],
    },
  },
});
