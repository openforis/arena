/**
 * Frontend client for the activity-log summarization feature (Tier 1 #5).
 */
import { streamSse } from './streaming'

/**
 * Streams a plain-language summary of the activity log. Returns a cancel
 * function the caller MUST invoke to abort the underlying fetch.
 * @param {object} args - Args.
 * @param {number} args.surveyId - Survey ID.
 * @param {string} [args.from] - ISO timestamp.
 * @param {string} [args.to] - ISO timestamp.
 * @param {string} [args.userUuid] - Optional contributor filter.
 * @param {Function} args.onChunk - Called with each text chunk.
 * @param {Function} [args.onDone] - Called when the stream completes.
 * @param {Function} [args.onError] - Called on transport / parse / server error.
 * @returns {Function} A cancel function.
 */
export const summarizeStream = ({ surveyId, from, to, userUuid, onChunk, onDone, onError }) => {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  if (userUuid) params.set('userUuid', userUuid)
  const qs = params.toString()
  const suffix = qs ? `?${qs}` : ''
  const url = `/api/ai/survey/${surveyId}/activityLog/summarize${suffix}`
  return streamSse(url, { onChunk, onDone, onError })
}
