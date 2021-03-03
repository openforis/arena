const jestConfig = require('../../jest.config')

process.env.JEST_PLAYWRIGHT_CONFIG = './jest-playwright.config.js'

module.exports = {
  ...jestConfig,
  preset: 'jest-playwright-preset',
  rootDir: './',
}
