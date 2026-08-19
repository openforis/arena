module.exports = {
  roots: ['<rootDir>/'],
  testEnvironment: 'node',
  setupFiles: [require.resolve('./test/unit/jest.setup.js')],
  moduleNameMapper: {
    '^@common/(.*)$': '<rootDir>/common/$1',
    '^@core/(.*)$': '<rootDir>/core/$1',
    '^@server/(.*)$': '<rootDir>/server/$1',
    '^@webapp/(.*)$': '<rootDir>/webapp/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
  },
  // The allowlist below only applies to a package's own (deepest) node_modules segment: the
  // `(?!.*/node_modules/)` guard forces the match position to be the LAST /node_modules/ in the
  // path, so a package that itself nests inside another, non-allowlisted package (e.g.
  // otplib -> @otplib/plugin-crypto-noble -> node_modules/@noble/hashes, a doubly-nested ESM
  // dependency pulled in transitively via the @openforis/arena-server portal link) is still
  // transformed based on its own immediate package name, instead of being skipped just because an
  // earlier, non-allowlisted wrapper package appears earlier in the path.
  transformIgnorePatterns: [
    '/node_modules/(?!.*/node_modules/)(?!change-case/|uuid/|@openforis/arena-server/|@scure/|@noble/|zod/|ai/|@ai-sdk/|eventsource-parser/)',
  ],
  verbose: true,
}
