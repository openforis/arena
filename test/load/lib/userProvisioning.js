const crypto = require('node:crypto')

const LOAD_TEST_EMAIL_DOMAIN = 'loadtest.local'

/**
 * Builds a random password satisfying the server's password validator (core/user/userPasswordValidator.ts):
 * no whitespace, at least 8 chars, at least one uppercase, one lowercase and one digit. The fixed
 * prefix/suffix guarantee the required character classes; the random segment guarantees it's not a
 * hardcoded secret. This password is ephemeral: it's generated fresh per run and never logged back
 * into after the run completes, so it does not need to be memorable, reused, or persisted anywhere.
 * @returns {string} A freshly generated random password.
 */
const generateLoadTestUserPassword = () => `LoadTest${crypto.randomUUID().slice(0, 8)}Aa1!`

/**
 * Builds deterministic credentials for N throwaway load-test users, unique to this run. The password is
 * randomized once per run (shared by every user in that run) rather than hardcoded; see
 * generateLoadTestUserPassword for why that's safe for these throwaway, never-logged-into-again accounts.
 * @param {object} params - Function parameters.
 * @param {number} params.runId - Unique identifier for this run (e.g. Date.now()).
 * @param {number} params.count - Number of user credential sets to build.
 * @returns {Array<{name: string, email: string, password: string}>} One credential set per user, in index order.
 */
const buildLoadTestUserCredentials = ({ runId, count }) => {
  const password = generateLoadTestUserPassword()
  return Array.from({ length: count }, (_, i) => ({
    name: `Load Test User ${runId}_${i}`,
    email: `stress_test_${runId}_${i}@${LOAD_TEST_EMAIL_DOMAIN}`,
    password,
  }))
}

module.exports = { buildLoadTestUserCredentials, generateLoadTestUserPassword }
