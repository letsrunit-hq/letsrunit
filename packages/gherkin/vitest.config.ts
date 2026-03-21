import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      exclude: [
        '**/tests/**',
        'src/index.ts',
        'src/locator/index.ts',
      ],
    },
  },
});
