import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';
const port = new URL(baseURL).port || '3000';

export default defineConfig({
  testDir: './src/test/e2e',
  use: { baseURL, trace: 'on-first-retry' },
  webServer: { command: `pnpm exec next start --port ${port}`, url: baseURL, env: { ...process.env, E2E_TEST_UNAVAILABLE_PRODUCT: 'true' }, reuseExistingServer: !process.env.CI },
  projects: [{ name: 'mobile-chromium', use: { ...devices['iPhone 13'] } }],
});
