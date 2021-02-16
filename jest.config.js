process.env.JEST_PLAYWRIGHT_CONFIG = 'test/e2e_playwright/config/jest-playwright.config.js'

module.exports = {
  verbose: true,
  preset: 'jest-playwright-preset',
}
