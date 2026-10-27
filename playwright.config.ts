import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  use: { baseURL: 'http://127.0.0.1:6007', viewport: { width: 1440, height: 1000 } },
  webServer: {
    command:
      'pnpm exec vite preview --outDir storybook-static --host 127.0.0.1 --port 6007 --strictPort',
    url: 'http://127.0.0.1:6007',
    reuseExistingServer: !process.env.CI,
  },
});
