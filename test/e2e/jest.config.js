const path = require('node:path')

const jestConfig = require('../../jest.config')

process.env.JEST_PLAYWRIGHT_CONFIG = './jest-playwright.config.js'

module.exports = {
  ...jestConfig,
  preset: 'jest-playwright-preset',
  testEnvironment: 'jest-playwright-preset',
  rootDir: './',
  // babel-jest looks up the project-wide babel.config.js from rootDir: point it to the repository root one
  transform: {
    '\\.[jt]sx?$': ['babel-jest', { configFile: path.resolve(__dirname, '../../babel.config.js') }],
  },
}
