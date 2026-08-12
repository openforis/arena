import { computeStats } from './stats.ts'

export type Outcome = 'succeeded' | 'failed' | 'timed-out' | 'canceled' | 'rejected-at-http'

export interface ResultEntry {
  index: number
  name: string
  outcome: Outcome
  surveyId: number | null
  acceptMs: number | null
  jobMs: number | null
  error: string | null
}

const OUTCOME_ORDER: Outcome[] = ['succeeded', 'failed', 'timed-out', 'canceled', 'rejected-at-http']

/**
 * Formats a millisecond duration for display, or 'n/a' when not available.
 * @param value - Duration in milliseconds, or null.
 * @returns Formatted duration.
 */
const formatMs = (value: number | null | undefined): string =>
  value === null || value === undefined ? 'n/a' : `${Math.round(value)}ms`

/**
 * Builds a human-readable summary report for a stress test run.
 * @param params - Function parameters.
 * @param params.results - Per-request result objects.
 * @param params.totalDurationMs - Total wall-clock duration of the run, in milliseconds.
 * @returns The formatted report.
 */
export const formatSummary = ({
  results,
  totalDurationMs,
}: {
  results: ResultEntry[]
  totalDurationMs: number
}): string => {
  const total = results.length
  const byOutcome = results.reduce<Record<string, number>>((acc, result) => {
    acc[result.outcome] = (acc[result.outcome] || 0) + 1
    return acc
  }, {})

  const acceptStats = computeStats(
    results.filter((result) => result.acceptMs !== null).map((result) => result.acceptMs as number)
  )
  const jobStats = computeStats(
    results.filter((result) => result.jobMs !== null).map((result) => result.jobMs as number)
  )

  const lines: string[] = []
  lines.push(
    '',
    '==================== Survey Import Stress Test Summary ====================',
    `Total requests: ${total}`,
    `Total duration: ${formatMs(totalDurationMs)}`,
    '',
    'Outcomes:'
  )
  OUTCOME_ORDER.forEach((outcome) => {
    lines.push(`  ${outcome}: ${byOutcome[outcome] || 0}`)
  })
  lines.push('')
  const acceptLatencies = [acceptStats.min, acceptStats.avg, acceptStats.max, acceptStats.p95].map(formatMs).join(' / ')
  lines.push(`Accept latency  (min/avg/max/p95): ${acceptLatencies}`)
  const jobLatencies = [jobStats.min, jobStats.avg, jobStats.max, jobStats.p95].map(formatMs).join(' / ')
  lines.push(`Job latency     (min/avg/max/p95): ${jobLatencies}`)

  const failures = results.filter((result) => result.outcome !== 'succeeded')
  if (failures.length > 0) {
    lines.push('', 'Failures:')
    failures.forEach((failure) => {
      lines.push(`  [${failure.index}] ${failure.name} - ${failure.outcome}: ${failure.error || 'no error detail'}`)
    })
  }
  lines.push('=============================================================================', '')

  return lines.join('\n')
}
