import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'tests/**/*.test.ts',
    ],
    coverage: {
      include: [
        'src/**/*.ts'
      ],
      exclude: [
        '**/tests/**',
        '**/index.ts',
        'src/types/**/*.ts',
        'src/types.ts',
        'src/sink/no-sink.ts',
      ],
    },
  }
});
