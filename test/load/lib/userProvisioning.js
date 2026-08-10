const LOAD_TEST_USER_PASSWORD = 'LoadTestUser1Aa!'
const LOAD_TEST_EMAIL_DOMAIN = 'loadtest.local'

/**
 * Builds deterministic credentials for N throwaway load-test users, unique to this run.
 * @param {object} params - Function parameters.
 * @param {number} params.runId - Unique identifier for this run (e.g. Date.now()).
 * @param {number} params.count - Number of user credential sets to build.
 * @returns {Array<{name: string, email: string, password: string}>} One credential set per user, in index order.
 */
const buildLoadTestUserCredentials = ({ runId, count }) =>
  Array.from({ length: count }, (_, i) => ({
    name: `Load Test User ${runId}_${i}`,
    email: `stress_test_${runId}_${i}@${LOAD_TEST_EMAIL_DOMAIN}`,
    password: LOAD_TEST_USER_PASSWORD,
  }))

module.exports = { buildLoadTestUserCredentials }
