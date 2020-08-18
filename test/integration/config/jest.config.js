const path = require('path')
require('dotenv').config({
  path: '../.env',
})

module.exports = {
  rootDir: path.resolve(__dirname, '..', '..', '..'),
  moduleNameMapper: {
    '@common/(.*)': '<rootDir>/common/$1',
    '@core/(.*)': '<rootDir>/core/$1',
    '@server/(.*)': '<rootDir>/server/$1',
    '@webapp/(.*)': '<rootDir>/webapp/$1',
    '@test/(.*)': '<rootDir>/test/$1',
  },
  // transform: {
  //   '^.+\\.js$': '<rootDir>/../node_modules/babel-jest',
  // },
  setupFilesAfterEnv: ['<rootDir>/dist/__tests__/bundle.integration-setup.js'],
}
