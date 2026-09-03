import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:3100';

export default defineConfig({
  testDir: './src/test/e2e',
  use: { baseURL, trace: 'on-first-retry' },
  webServer: {
    command: 'pnpm exec next start --port 3100',
    url: baseURL,
    env: {
      ...process.env,
      E2E_TEST_UNAVAILABLE_PRODUCT: 'true',
      E2E_TEST_ERROR_BOUNDARY: 'true',
      NEXT_PUBLIC_SUPABASE_URL: '',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
    },
    reuseExistingServer: false,
  },
  projects: [{ name: 'mobile-chromium', use: { ...devices['iPhone 13'] } }],
});
