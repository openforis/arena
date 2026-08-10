const { computeStats } = require('./stats')

const OUTCOME_ORDER = ['succeeded', 'failed', 'timed-out', 'canceled', 'rejected-at-http']

/**
 * Formats a millisecond duration for display, or 'n/a' when not available.
 * @param {number|null} value - Duration in milliseconds, or null.
 * @returns {string} Formatted duration.
 */
const formatMs = (value) => (value === null || value === undefined ? 'n/a' : `${Math.round(value)}ms`)

/**
 * Builds a human-readable summary report for a stress test run.
 * @param {object} params - Function parameters.
 * @param {Array<object>} params.results - Per-request result objects (see report.test.js for the shape).
 * @param {number} params.totalDurationMs - Total wall-clock duration of the run, in milliseconds.
 * @returns {string} The formatted report.
 */
const formatSummary = ({ results, totalDurationMs }) => {
  const total = results.length
  const byOutcome = results.reduce((acc, result) => {
    acc[result.outcome] = (acc[result.outcome] || 0) + 1
    return acc
  }, {})

  const acceptStats = computeStats(
    results.filter((result) => result.acceptMs !== null).map((result) => result.acceptMs)
  )
  const jobStats = computeStats(results.filter((result) => result.jobMs !== null).map((result) => result.jobMs))

  const lines = []
  lines.push('')
  lines.push('==================== Survey Import Stress Test Summary ====================')
  lines.push(`Total requests: ${total}`)
  lines.push(`Total duration: ${formatMs(totalDurationMs)}`)
  lines.push('')
  lines.push('Outcomes:')
  OUTCOME_ORDER.forEach((outcome) => {
    lines.push(`  ${outcome}: ${byOutcome[outcome] || 0}`)
  })
  lines.push('')
  lines.push(
    `Accept latency  (min/avg/max/p95): ${formatMs(acceptStats.min)} / ${formatMs(acceptStats.avg)} / ${formatMs(acceptStats.max)} / ${formatMs(acceptStats.p95)}`
  )
  lines.push(
    `Job latency     (min/avg/max/p95): ${formatMs(jobStats.min)} / ${formatMs(jobStats.avg)} / ${formatMs(jobStats.max)} / ${formatMs(jobStats.p95)}`
  )

  const failures = results.filter((result) => result.outcome !== 'succeeded')
  if (failures.length > 0) {
    lines.push('')
    lines.push('Failures:')
    failures.forEach((failure) => {
      lines.push(`  [${failure.index}] ${failure.name} - ${failure.outcome}: ${failure.error || 'no error detail'}`)
    })
  }
  lines.push('=============================================================================')
  lines.push('')

  return lines.join('\n')
}

module.exports = { formatSummary }
