/**
 * AI descriptions of the schema summary export (data dictionary), generated in the browser: the server lists the
 * node defs without a description, the shared task describes them in batches with the model of resolveModel, and
 * the export job only writes them (it validates them first: known uuids, length).
 */
import { AiLimits } from '@common/ai/limits'
import type { AiGenerateText } from '@common/ai/llm'
import { type AiDataDictionaryNodeDef, generateDataDictionaryDescriptions } from '@common/ai/tasks/dataDictionary'

import { resolveBatchModel } from './batchModel'
import { type AiBatchGuard, type AiBatchProgress, type AiBatchStop, chunkArray, runAiBatchCalls } from './batchRun'

export type SchemaSummaryAiItems = { surveyName: string; nodeDefs: AiDataDictionaryNodeDef[] }

export type DataDictionaryResult = {
  aiDescriptions: Record<string, string>
  failedCount: number
  // present when the run stopped before its last call: the descriptions are those made until then
  stop?: AiBatchStop
}

type FetchAiItems = (params: { surveyId: number; cycle: string; signal?: AbortSignal }) => Promise<SchemaSummaryAiItems>

type ProgressListener = (progress: AiBatchProgress) => void

/**
 * Fetches the node defs to describe through the survey API (loaded lazily: it pulls in the HTTP client).
 * @param {object} params - Parameters (surveyId, cycle, signal).
 * @returns {Promise<SchemaSummaryAiItems>} The items.
 */
const fetchAiItemsFromApi: FetchAiItems = async (params) => {
  const { fetchSchemaSummaryAiItems } = await import('@webapp/service/api/survey')
  return fetchSchemaSummaryAiItems(params)
}

/**
 * Trims a description and cuts it to the length the export accepts.
 * @param {unknown} description - Description returned by the model.
 * @param {number} [maxChars] - Longest description accepted.
 * @returns {string} The description ('' when not usable).
 */
export const cleanAiDescription = (
  description: unknown,
  maxChars: number = AiLimits.dataDictionaryMaxDescriptionChars
): string => {
  if (typeof description !== 'string') return ''
  const trimmed = description.trim()
  return trimmed.length > maxChars ? `${trimmed.slice(0, maxChars - 1)}…` : trimmed
}

/**
 * Describes the node defs in batches (testable core: generator, guard and task injected).
 * @param {object} params - Parameters.
 * @param {SchemaSummaryAiItems} params.items - Survey name and node defs to describe.
 * @param {AiGenerateText} params.generateText - Text generator.
 * @param {AiBatchGuard} params.guard - Check run before each call.
 * @param {AbortSignal} [params.signal] - Cancellation signal.
 * @param {Function} [params.onProgress] - Progress listener ({ done, total } calls).
 * @param {Function} [params.describe] - The data dictionary task (tests).
 * @param {number} [params.batchSize] - Node defs per call.
 * @returns {Promise<DataDictionaryResult>} Descriptions by uuid, and the node defs left without one (the ones a
 * stopped run did not reach included).
 */
export const runDataDictionaryDescriptions = async ({
  items,
  generateText,
  guard,
  signal,
  onProgress,
  describe = generateDataDictionaryDescriptions,
  batchSize = AiLimits.dataDictionaryBatchSize,
}: {
  items: SchemaSummaryAiItems
  generateText: AiGenerateText
  guard: AiBatchGuard
  signal?: AbortSignal
  onProgress?: ProgressListener
  describe?: typeof generateDataDictionaryDescriptions
  batchSize?: number
}): Promise<DataDictionaryResult> => {
  const nodeDefs = items.nodeDefs.slice(0, AiLimits.dataDictionaryMaxDescriptions)
  const batches = chunkArray(nodeDefs, batchSize)
  const aiDescriptions: Record<string, string> = {}
  const { stop } = await runAiBatchCalls({
    calls: batches.map((batch) => ({
      size: batch.length,
      run: (callSignal?: AbortSignal) =>
        describe({ generateText, surveyName: items.surveyName, nodeDefs: batch, signal: callSignal }),
    })),
    guard,
    signal,
    onProgress,
    onResult: ({ descriptions }, index) => {
      // only the node defs of the batch: the export rejects any other uuid
      const batchUuids = new Set(batches[index].map(({ uuid }) => uuid))
      for (const { uuid, description } of descriptions) {
        const cleaned = cleanAiDescription(description)
        if (batchUuids.has(uuid) && cleaned) aiDescriptions[uuid] = cleaned
      }
    },
  })
  // failed batches and node defs the model skipped are both left empty in the export
  const failedCount = nodeDefs.length - Object.keys(aiDescriptions).length
  return stop ? { aiDescriptions, failedCount, stop } : { aiDescriptions, failedCount }
}

/**
 * Generates the AI descriptions of the schema summary export with the model of the data dictionary feature.
 * @param {object} params - Parameters.
 * @param {number} params.surveyId - Survey id.
 * @param {string} params.cycle - Cycle key.
 * @param {AbortSignal} [params.signal] - Cancellation signal.
 * @param {Function} [params.onProgress] - Progress listener.
 * @param {FetchAiItems} [params.fetchAiItems] - Fetches the node defs to describe (tests).
 * @returns {Promise<DataDictionaryResult>} Descriptions by uuid, and the node defs left without one.
 */
export const generateDataDictionaryWorkflow = async ({
  surveyId,
  cycle,
  signal,
  onProgress,
  fetchAiItems = fetchAiItemsFromApi,
}: {
  surveyId: number
  cycle: string
  signal?: AbortSignal
  onProgress?: ProgressListener
  fetchAiItems?: FetchAiItems
}): Promise<DataDictionaryResult> => {
  const items = await fetchAiItems({ surveyId, cycle, signal })
  // every node def has a description: no model, no consent dialog
  if (items.nodeDefs.length === 0) return { aiDescriptions: {}, failedCount: 0 }
  const { generateText, guard } = await resolveBatchModel({ feature: 'dataDictionary', surveyId, signal })
  return runDataDictionaryDescriptions({ items, generateText, guard, signal, onProgress })
}
