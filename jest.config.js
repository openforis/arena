module.exports = {
  moduleNameMapper: {
    '@common/(.*)': '<rootDir>/common/$1',
    '@core/(.*)': '<rootDir>/core/$1',
    '@server/(.*)': '<rootDir>/server/$1',
    '@webapp/(.*)': '<rootDir>/webapp/$1',
    '@test/(.*)': '<rootDir>/test/$1',
  },
  testTimeout: 30000,
}
