import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
// Optional: use a preinstalled Chromium (e.g. CI images) instead of Playwright's download.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    // Allow HTTPS behind intercepting proxies when testing a deployed site.
    ignoreHTTPSErrors: baseURL.startsWith('https://'),
  },
  projects: [
    // Pure logic tests (lib/*): no browser, no server.
    { name: 'unit', testDir: './tests/unit' },
    {
      name: 'chromium',
      testDir: './tests/playwright',
      use: { ...devices['Desktop Chrome'], launchOptions: executablePath ? { executablePath } : {} },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : { command: 'npm run dev', url: baseURL, reuseExistingServer: true, timeout: 120_000 },
});
