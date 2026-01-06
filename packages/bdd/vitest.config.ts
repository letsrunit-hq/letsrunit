import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/types.ts', 'src/define.ts', 'src/_stub.ts'],
    }
  }
});

