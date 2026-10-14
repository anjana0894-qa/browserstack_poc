// @ts-check
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

/**
 * Browser-like context for handling WAFs or automation flags.
 */
function monitoringBrowserLikeUse() {
  const d = { ...devices['Desktop Chrome'] };
  const ua =
    process.env.COMPANY_USER_AGENT && String(process.env.COMPANY_USER_AGENT).trim()
      ? String(process.env.COMPANY_USER_AGENT).trim()
      : d.userAgent;
  const m = ua.match(/Chrome\/(\d+)/);
  const major = m ? m[1] : '120';

  /** @type {import('@playwright/test').Project['use'] & { channel?: string }} */
  const use = {
    ...d,
    userAgent: ua,
    locale: process.env.COMPANY_LOCALE || 'en-US',
    timezoneId: process.env.COMPANY_TIMEZONE || 'America/New_York',
    channel: process.env.PLAYWRIGHT_CHROME_CHANNEL || undefined,
    launchOptions: {
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
      ],
    },
    extraHTTPHeaders: {
      'Accept-Language': process.env.COMPANY_ACCEPT_LANGUAGE || 'en-US,en;q=0.9',
      'sec-ch-ua': `"Chromium";v="${major}", "Google Chrome";v="${major}", "Not A(Brand";v="24"`,
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
    },
  };

  if (!use.channel) {
    delete use.channel;
  }
  return use;
}

export default defineConfig({
  timeout: 30000,
  expect: {
    timeout: 7000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: (() => {
    if (process.env.CI) return 1;
    const n = Number(process.env.PW_WORKERS);
    if (Number.isFinite(n) && n >= 1) return Math.floor(n);
    return 3;
  })(),
  reporter: [['html'], ['list']],
  use: {
    actionTimeout: 7000,
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'visual-validation',
      testDir: './functional/visual-validation',
      testMatch: '**/*.spec.js',
      use: {
        ...monitoringBrowserLikeUse(),
        screenshot: 'on',
        video: 'off',
      },
      workers: (() => {
        if (process.env.CI) return 1;
        const n = Number(process.env.PW_WORKERS);
        if (Number.isFinite(n) && n >= 1) return Math.min(5, Math.floor(n));
        return 1;
      })(),
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});