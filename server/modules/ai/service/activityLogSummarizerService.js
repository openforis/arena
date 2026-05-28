/**
 * Service for the activity-log summarization feature (Tier 1 #5).
 *
 * Pipeline:
 *   1. Fetch up to N entries via the existing ActivityLogManager.fetch.
 *   2. Filter in-memory by the (from, to) window.
 *   3. Aggregate `user × type → count + samples`.
 *   4. Build a compact prompt and stream the summary via modelClient.stream.
 */
import * as ActivityLogManager from '@server/modules/activityLog/manager/activityLogManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import * as Survey from '@core/survey/survey'
import SystemError from '@core/systemError'

import * as ModelClient from './modelClient'
import { buildActivityLogSummaryPrompt } from './prompts/activityLogSummary'

const MAX_FETCH = 1000

// Hard cap on the per-row identifier strings before they reach the
// prompt; bounds prompt size and stops a malicious display-name from
// blowing up the Map keyspace (with MAX_FETCH entries, an unbounded
// userName lets a single user balloon memory by N×userName.length).
const MAX_AGGREGATE_KEY_LEN = 64

const truncateKey = (value) =>
  typeof value === 'string' && value.length > MAX_AGGREGATE_KEY_LEN ? value.slice(0, MAX_AGGREGATE_KEY_LEN) : value

const aggregate = ({ entries, userUuidFilter }) => {
  const filtered = userUuidFilter ? entries.filter((e) => e.userUuid === userUuidFilter) : entries
  const map = new Map()
  for (const entry of filtered) {
    const userKey = truncateKey(entry.userName || entry.userUuid || 'unknown')
    const type = truncateKey(entry.type)
    const key = `${userKey}|${type}`
    let row = map.get(key)
    if (!row) {
      row = { user: userKey, type, count: 0, samples: [] }
      map.set(key, row)
    }
    row.count += 1
    if (row.samples.length < 3 && entry.dateCreated) {
      row.samples.push(new Date(entry.dateCreated).toISOString().slice(0, 19))
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count)
}

/**
 * Streams a plain-language summary of the activity log for the given window.
 * @param {object} args - Args.
 * @param {object} args.user - Acting user.
 * @param {number} args.surveyId - Survey ID.
 * @param {string} [args.from] - ISO timestamp inclusive lower bound.
 * @param {string} [args.to] - ISO timestamp inclusive upper bound.
 * @param {string} [args.userUuid] - Optional filter to one contributor.
 * @param {AbortSignal} [args.signal] - Cancellation signal.
 * @returns {Promise<{textStream: AsyncIterable<string>, usage: Promise<object>}>}
 *   The streaming result.
 */
export const summarize = async ({ user, surveyId, from, to, userUuid, signal }) => {
  if (!surveyId) throw new SystemError('aiActivityLogSurveyMissing')

  const surveyInfo = await SurveyManager.fetchSurveyById({ surveyId })
  const surveyName = Survey.getName(surveyInfo) || `survey-${surveyId}`

  const fromMs = from ? Date.parse(from) : 0
  const toMs = to ? Date.parse(to) : Number.MAX_SAFE_INTEGER

  // ActivityLogManager.fetch's `orderBy` is the sort DIRECTION only — the
  // SQL orders by `l.id ${orderBy}` with the column hardcoded. Passing a
  // full clause like `'date_created DESC'` produces invalid SQL.
  const raw = await ActivityLogManager.fetch({
    user,
    surveyId,
    limit: MAX_FETCH,
    orderBy: 'DESC',
  })

  const inWindow = raw.filter((e) => {
    const t = e.dateCreated ? Date.parse(e.dateCreated) : 0
    return t >= fromMs && t <= toMs
  })

  const aggregates = aggregate({ entries: inWindow, userUuidFilter: userUuid })

  const { system, prompt } = buildActivityLogSummaryPrompt({
    surveyName,
    from:
      from ||
      (inWindow.length
        ? new Date(Math.min(...inWindow.map((e) => Date.parse(e.dateCreated)))).toISOString()
        : 'beginning'),
    to:
      to ||
      (inWindow.length ? new Date(Math.max(...inWindow.map((e) => Date.parse(e.dateCreated)))).toISOString() : 'now'),
    totalCount: inWindow.length,
    aggregates,
  })

  return ModelClient.stream({
    user,
    feature: 'activityLogSummary',
    prompt,
    system,
    signal,
  })
}
