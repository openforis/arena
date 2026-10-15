/**
 * Validation errors suggestion: many validation messages in the current cycle (Cleaning area), counted when the report opens.
 */
import { logAiWarning, type AiLog } from '@webapp/ai/log/aiLog'
import type { CleaningApi } from '@webapp/ai/tools/cleaning/cleaningApi'
import type { AssistantArea } from '@webapp/components/ai/Assistant/assistantAreas'

import type { AssistantSuggestion } from '../types'
import type { SuggestionGeneration } from '../generation'
import type { EventDetector, SuggestionEvent } from './types'
import { getSuggestionExpiresAt } from './suggestionExpiry'

export const VALIDATION_MESSAGES_THRESHOLD = 20

// the only target: the whole cycle, counted (a dismissal returns when it grows by the growth step)
export const VALIDATION_ERRORS_TARGET_KEY = 'cycle'

type CountValidationReportRows = CleaningApi['countValidationReportRows']

/**
 * Returns the id of the validation errors suggestion of a cycle.
 * @param {string} cycle - Cycle key.
 * @returns {string} The id.
 */
export const getValidationErrorsSuggestionId = (cycle: string): string => `validationErrors:${cycle}`

/**
 * Builds the validation errors suggestion of a cycle.
 * @param {object} params - Parameters.
 * @param {number} params.surveyId - Survey id.
 * @param {string} params.cycle - Cycle key.
 * @param {number} params.count - Number of report rows.
 * @param {Date} params.createdAt - Creation date.
 * @returns {AssistantSuggestion} The suggestion.
 */
export const buildValidationErrorsSuggestion = ({
  surveyId,
  cycle,
  count,
  createdAt,
}: {
  surveyId: number
  cycle: string
  count: number
  createdAt: Date
}): AssistantSuggestion => ({
  id: getValidationErrorsSuggestionId(cycle),
  kind: 'validationErrors',
  area: 'cleaning',
  surveyId,
  cycle,
  targets: [{ key: VALIDATION_ERRORS_TARGET_KEY, count }],
  createdAt: createdAt.toISOString(),
  expiresAt: getSuggestionExpiresAt(createdAt),
})

/**
 * Tells whether the event is a report opened in the cycle of the generation, with the Cleaning area available.
 * @param {SuggestionEvent} event - The event.
 * @param {SuggestionGeneration} generation - The current generation.
 * @param {AssistantArea[]} availableAreas - Areas available to the user.
 * @returns {boolean} True to count the messages.
 */
const isReportOfGeneration = (
  event: SuggestionEvent,
  generation: SuggestionGeneration,
  availableAreas: AssistantArea[]
): boolean =>
  event.type === 'validationReportOpened' && event.cycle === generation.cycle && availableAreas.includes('cleaning')

/**
 * Counts the messages of the whole cycle, as the report shows them before any filter.
 * @param {object} params - Parameters.
 * @param {CountValidationReportRows} params.countRows - The count request.
 * @param {SuggestionGeneration} params.generation - The current generation (survey, cycle, abort signal).
 * @param {AiLog} params.log - Reports a failed request (not an aborted one).
 * @returns {Promise<number|null>} The count; null when the request failed or the generation ended.
 */
const countCycleMessages = async ({
  countRows,
  generation,
  log,
}: {
  countRows: CountValidationReportRows
  generation: SuggestionGeneration
  log: AiLog
}): Promise<number | null> => {
  const { surveyId, cycle, signal } = generation
  try {
    const count = await countRows({ surveyId, cycle, signal })
    // a late answer of an ended generation is dropped
    return signal.aborted || !Number.isFinite(count) ? null : count
  } catch (error) {
    // aborted, timed out or refused: no suggestion this time (an abort is expected, the rest is reported)
    if (!signal.aborted) log('The validation messages could not be counted for the suggestion', error)
    return null
  }
}

/**
 * Creates the detector of the validation errors suggestion.
 * @param {object} deps - Dependencies.
 * @param {CountValidationReportRows} deps.countRows - Counts the validation report rows (Arena's server).
 * @param {AiLog} [deps.log] - Reports a failed count.
 * @returns {EventDetector} The detector.
 */
export const createValidationErrorsDetector = ({
  countRows,
  log = logAiWarning,
}: {
  countRows: CountValidationReportRows
  log?: AiLog
}): EventDetector => ({
  kind: 'validationErrors',
  area: 'cleaning',
  needsDraft: false,
  on: ['validationReportOpened'],
  /**
   * Counts the messages of the cycle and replaces the suggestion (removed below the threshold).
   * @param {SuggestionEvent} event - The event.
   * @param {object} ctx - Detector context.
   * @returns {Promise<void>} Resolves when the store is updated.
   */
  handle: async (event, ctx) => {
    const { generation } = ctx
    if (!generation || !isReportOfGeneration(event, generation, ctx.availableAreas)) return
    const count = await countCycleMessages({ countRows, generation, log })
    if (count === null) return
    const { userUuid, surveyId, cycle } = generation
    const id = getValidationErrorsSuggestionId(cycle)
    if (count < VALIDATION_MESSAGES_THRESHOLD) {
      // the issue is gone: a later count must not be compared with a dismissal made for an older, larger one
      ctx.store.removeTargets({ userUuid, surveyId, id, targetKeys: [VALIDATION_ERRORS_TARGET_KEY] })
      return
    }
    // replaced on every open: a fresh count, createdAt and expiry
    ctx.store.remove({ userUuid, surveyId, id })
    ctx.store.add({
      userUuid,
      suggestion: buildValidationErrorsSuggestion({ surveyId, cycle, count, createdAt: ctx.now() }),
    })
  },
})
