import { defineConfig } from '@playwright/experimental-ct-react';

export default defineConfig({
  testDir: './tests',

  timeout: 5_000,

  use: {
    //ctPort: 3100,
    viewport: { width: 1280, height: 800 },
  },

  expect: {
    timeout: 1_000,
  },
});
