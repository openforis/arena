import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'test/e2e/__tests__',
  testMatch: '**/*.js',
})
