import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'],
    globals: true,
    css: true,
    include: [
      'src/**/*.{test,spec}.{ts,tsx,js,jsx}',
      // Also allow tests under app/ when not inside src
      'app/**/*.{test,spec}.{ts,tsx,js,jsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      // No dedicated top-level test(s) folder needed anymore
      'tests',
      'test'
    ]
  }
});

