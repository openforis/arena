module.exports = {
  roots: ['<rootDir>/'],
  testEnvironment: 'node',
  setupFiles: [require.resolve('./test/unit/jest.setup.js')],
  transformIgnorePatterns: [
    '/node_modules/(?!change-case/|uuid/|@openforis/arena-server/|@openforis/arena-core/node_modules/uuid/|@scure/|@noble/|zod/|ai/|@ai-sdk/|eventsource-parser/)',
  ],
  verbose: true,
}
