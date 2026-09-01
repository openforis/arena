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
  // dependency pulled in transitively via the @openforis/arena-server portal link) is still
  // transformed based on its own immediate package name, instead of being skipped just because an
  // earlier, non-allowlisted wrapper package appears earlier in the path.
  transformIgnorePatterns: [
    '/node_modules/(?!.*/node_modules/)(?!change-case/|uuid/|@openforis/arena-server/|@scure/|@noble/|zod/|ai/|@ai-sdk/|eventsource-parser/)',
  ],
  verbose: true,
}
