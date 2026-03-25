module.exports = {
  roots: ['<rootDir>/'],
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/test/unit/jest.setup.js'],
  transformIgnorePatterns: [
    '/node_modules/(?!change-case/|uuid/|@openforis/arena-core/node_modules/uuid/|@scure/|@noble/)',
  ],
  verbose: true,
}
