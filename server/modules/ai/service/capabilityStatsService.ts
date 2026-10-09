/**
 * Anonymous capability statistics (opt-in): validation and recording, without the request's user.
 */
import { type AiCapabilityStats, parseCapabilityStats } from '@common/ai/capabilityStats'
import SystemError, { StatusCodes } from '@core/systemError'

import { isCapabilityStatsEnabledForUser } from './aiUserPrefs'

/**
 * Validates and records the statistics when the user opted in; ignores them otherwise.
 * @param {object} params - Parameters.
 * @param {object} params.user - Logged-in user (only the opt-in is read; it is never passed to `record`).
 * @param {unknown} params.body - Request body.
 * @param {Function} params.record - Writes the statistics.
 * @returns {boolean} True when recorded.
 */
export const handleCapabilityStats = ({
  user,
  body,
  record,
}: {
  user: Parameters<typeof isCapabilityStatsEnabledForUser>[0]
  body: unknown
  record: (stats: AiCapabilityStats) => void
}): boolean => {
  if (!isCapabilityStatsEnabledForUser(user)) return false
  const stats = parseCapabilityStats(body)
  if (!stats) throw new SystemError('aiCapabilityStatsInvalid', {}, StatusCodes.BAD_REQUEST)
  record(stats)
  return true
}
