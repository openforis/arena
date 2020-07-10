module.exports = {
  moduleNameMapper: {
    '@common/(.*)': '<rootDir>/common/$1',
    '@core/(.*)': '<rootDir>/core/$1',
    '@server/(.*)': '<rootDir>/server/$1',
    '@webapp/(.*)': '<rootDir>/webapp/$1',
    '@test/(.*)': '<rootDir>/test/$1',
  },
  transform: {
    '.*': '<rootDir>/node_modules/babel-jest',
  },
  transformIgnorePatterns: ['/node_modules/'],
  moduleFileExtensions: ['js', 'json', 'html', 'scss'],
  testTimeout: 30000,
  coveragePathIgnorePatterns: ['/node_modules/'],
}
