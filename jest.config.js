module.exports = {
  roots: ['<rootDir>/'],
  testEnvironment: 'node',
  setupFiles: [require.resolve('./test/unit/jest.setup.js')],
  // Claude Code checks out isolated git worktrees under .claude/worktrees/ (see
  // .git/info/exclude). Each one is a full copy of this repo, including its own prebuilt
  // dist/__tests__/bundle.unit.js. Without these, `roots: ['<rootDir>/']` sweeps those stale,
  // frozen builds into every test run as extra suites (and their package.json, sharing this
  // repo's name, causes haste module-naming collisions).
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/\\.claude/worktrees/'],
  modulePathIgnorePatterns: ['<rootDir>/\\.claude/worktrees/'],
  // The allowlist below only applies to a package's own (deepest) node_modules segment: the
  // `(?!.*/node_modules/)` guard forces the match position to be the LAST /node_modules/ in the
  // path, so a package that itself nests inside another, non-allowlisted package (e.g.
  // otplib -> @otplib/plugin-crypto-noble -> node_modules/@noble/hashes, a doubly-nested ESM
  // dependency pulled in transitively via the @openforis/arena-server dependency) is still
  // transformed based on its own immediate package name, instead of being skipped just because an
  // earlier, non-allowlisted wrapper package appears earlier in the path.
  transformIgnorePatterns: [
    '/node_modules/(?!.*/node_modules/)(?!change-case/|uuid/|@openforis/arena-server/|@scure/|@noble/|zod/|ai/|@ai-sdk/|eventsource-parser/|n2words/)',
  ],
  // n2words (transitive dep of @openforis/arena-core, used by numberToWords) is exports-map-only,
  // no "main" field - jest-resolve 27 predates Node's package.json#exports resolution support, so
  // `require('n2words/en')` fails to resolve even though Node itself resolves it fine. Map each
  // subpath straight to its source file until Jest is upgraded past 27.
  // Resolved via require.resolve (not <rootDir>) so it still points here when this config is
  // spread into test/e2e/jest.config.js, which overrides rootDir to test/e2e/.
  // Path aliases (mirrors jsconfig.json / the webpack configs): unit and integration tests are bundled
  // by webpack, but e2e runs the sources directly through Jest, which needs them resolved here.
  moduleNameMapper: {
    '^@common/(.*)$': `${__dirname}/common/$1`,
    '^@core/(.*)$': `${__dirname}/core/$1`,
    '^@server/(.*)$': `${__dirname}/server/$1`,
    '^@webapp/(.*)$': `${__dirname}/webapp/$1`,
    '^@test/(.*)$': `${__dirname}/test/$1`,
    '^n2words/(.+)$': `${require.resolve('n2words/package.json').replace(/package\.json$/, 'src')}/$1.js`,
  },
  verbose: true,
}
