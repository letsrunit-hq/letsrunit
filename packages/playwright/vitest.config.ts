import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      exclude: [
        '**/tests/**',
        'src/translations/**',
        // Pure barrel re-exports — no executable statements
        'src/index.ts',
        'src/selector/index.ts',
      ],
    },
  },
});
