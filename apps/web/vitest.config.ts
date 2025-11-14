import { defineConfig } from 'vitest/config';
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, "src") }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'],
    globals: true,
    css: true,
    include: [
      'src/**/*.{test,spec}.{ts,tsx,js,jsx}',
    ],
    exclude: [
      'node_modules',
      'dist',
      '.next',
    ]
  }
});

