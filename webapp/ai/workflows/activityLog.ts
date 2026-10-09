/**
 * Activity log summary: the browser fetches the entries the user can see (activity log API), the shared
 * task aggregates them and the summary is streamed through the gateway.
 */
import type { LanguageModel } from 'ai'

import { AiLimits } from '@common/ai/limits'
import { buildActivityLogSummaryRequest, type AiActivityLogEntry } from '@common/ai/tasks/activityLog'

import { resolveGatewayModel } from '../runtime/resolveModel'
import { streamTextChunks } from '../runtime/textGenerators'

type FetchEntries = (params: { surveyId: number; limit: number; signal?: AbortSignal }) => Promise<AiActivityLogEntry[]>

/**
 * Fetches the latest entries through the activity log API (loaded lazily: it pulls in the HTTP client).
 * @param {object} params - Parameters (surveyId, limit, signal).
 * @returns {Promise<AiActivityLogEntry[]>} The entries, newest first.
 */
const fetchEntriesFromApi: FetchEntries = async ({ surveyId, limit, signal }) => {
  const { fetchActivityLogs } = await import('@webapp/service/api/activityLog')
  const { request, cancel } = fetchActivityLogs({ surveyId, params: { limit } })
  if (signal?.aborted) cancel()
  signal?.addEventListener('abort', cancel, { once: true })
  try {
    const { data } = await request
    return data?.activityLogs ?? []
  } finally {
    signal?.removeEventListener('abort', cancel)
  }
}

/**
 * Streams the summary of the latest activity log entries.
 * @param {object} params - Parameters (surveyId, surveyName, onChunk, signal, model, fetchEntries).
 * @returns {Promise<void>} Resolves when the summary is complete.
 */
export const summarizeActivityLogWorkflow = async ({
  surveyId,
  surveyName,
  onChunk,
  signal,
  model,
  fetchEntries = fetchEntriesFromApi,
}: {
  surveyId: number
  surveyName: string
  onChunk: (chunk: string) => void
  signal?: AbortSignal
  model?: LanguageModel
  fetchEntries?: FetchEntries
}): Promise<void> => {
  const entries = await fetchEntries({ surveyId, limit: AiLimits.activityLogMaxEntries, signal })
  const request = buildActivityLogSummaryRequest({ surveyName, entries })
  const resolvedModel = await resolveGatewayModel({ model, feature: 'activityLogSummary', surveyId })
  await streamTextChunks({ model: resolvedModel, ...request, onChunk, signal })
}
