import { defineConfig, devices } from '@playwright/test'

import { BASE_URL } from './config'

const isCI = !!process.env.CI

export default defineConfig({
  testDir: './specs',
  outputDir: './test-results',
  // every spec creates the data it needs (see fixtures/), so they can run in parallel and in any order
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  // more workers than the server job queue concurrency (JOB_QUEUE_CONCURRENCY, default 3) would only make
  // the survey creation jobs wait in the queue
  workers: isCI ? 2 : 3,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [[isCI ? 'github' : 'list'], ['html', { open: 'never', outputFolder: './playwright-report' }]],
  use: {
    baseURL: BASE_URL,
    acceptDownloads: true,
    geolocation: { latitude: 41.890221, longitude: 12.492348 },
    locale: 'en-GB',
    timezoneId: 'Europe/London',
    viewport: { width: 1366, height: 768 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } } }],
})
