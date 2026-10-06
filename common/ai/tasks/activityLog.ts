/**
 * Activity log summary: compact per user/type aggregates (bounded prompt size) and the summary request.
 */
import type { AiTextRequest } from '../llm'
import { AiLimits } from '../limits'
import { buildActivityLogSummaryPrompt } from '../prompts/activityLogSummary'

export type AiActivityLogEntry = { userUuid?: string; userName?: string; type?: string; dateCreated?: string }
export type AiActivityLogAggregate = { user: string; type: string; count: number; samples: string[] }

const MAX_SAMPLES = 3

const truncateKey = (value: string): string =>
  typeof value === 'string' && value.length > AiLimits.activityLogAggregateKeyMaxChars
    ? value.slice(0, AiLimits.activityLogAggregateKeyMaxChars)
    : value

/**
 * Groups the entries by user and activity type.
 * @param {AiActivityLogEntry[]} entries - Activity log entries.
 * @returns {AiActivityLogAggregate[]} The aggregates, most frequent first.
 */
export const aggregateActivityLogEntries = (entries: AiActivityLogEntry[]): AiActivityLogAggregate[] => {
  const rowsByKey = new Map<string, AiActivityLogAggregate>()
  for (const entry of entries) {
    const user = truncateKey(entry.userName || entry.userUuid || 'unknown')
    const type = truncateKey(entry.type)
    const key = `${user}|${type}`
    let row = rowsByKey.get(key)
    if (!row) {
      row = { user, type, count: 0, samples: [] }
      rowsByKey.set(key, row)
    }
    row.count += 1
    if (row.samples.length < MAX_SAMPLES && entry.dateCreated) {
      row.samples.push(new Date(entry.dateCreated).toISOString().slice(0, 19))
    }
  }
  return [...rowsByKey.values()].sort((rowA, rowB) => rowB.count - rowA.count)
}

const toTimes = (entries: AiActivityLogEntry[]): number[] =>
  entries.map((entry) => Date.parse(entry.dateCreated)).filter((time) => !Number.isNaN(time))

/**
 * Builds the summary request for the given activity log entries (newest first, as fetched).
 * @param {object} params - Parameters.
 * @param {string} params.surveyName - Survey name.
 * @param {AiActivityLogEntry[]} params.entries - The entries to summarize.
 * @returns {AiTextRequest} The system prompt and prompt.
 */
export const buildActivityLogSummaryRequest = ({
  surveyName,
  entries,
}: {
  surveyName: string
  entries: AiActivityLogEntry[]
}): AiTextRequest => {
  const times = toTimes(entries)
  return buildActivityLogSummaryPrompt({
    surveyName,
    from: times.length ? new Date(Math.min(...times)).toISOString() : 'beginning',
    to: times.length ? new Date(Math.max(...times)).toISOString() : 'now',
    totalCount: entries.length,
    aggregates: aggregateActivityLogEntries(entries),
  })
}
