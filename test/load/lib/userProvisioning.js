/**
 * Builds a list of distinct credential sets for load-test users, one per requested slot. Each set has a
 * unique email (scoped by runId so repeated runs don't collide) so callers can provision N separate
 * accounts instead of sharing a single one.
 * @param {object} params - Function parameters.
 * @param {number} params.count - How many distinct credential sets to build.
 * @param {number} params.runId - Unique identifier for the current run, used to keep emails unique across runs.
 * @returns {Array<{name: string, email: string, password: string}>} One credential set per requested slot.
 */
const buildLoadTestUserCredentials = ({ count, runId }) =>
  Array.from({ length: count }, (_, i) => ({
    name: `Load Test User ${runId}_${i}`,
    email: `load-test-${runId}-${i}@openforis-arena-stress-test.local`,
    password: `LoadTest_${runId}_${i}!`,
  }))

module.exports = { buildLoadTestUserCredentials }
