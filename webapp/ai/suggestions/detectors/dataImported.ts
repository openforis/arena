/**
 * Suggestion 8: records were imported into the active survey (Analysis area), from a succeeded import job.
 */
import * as JobSerialized from '@common/job/jobSerialized'

import type { AssistantSuggestion } from '../types'
import type { SuggestionGeneration } from '../generation'
import type { SuggestionStore } from '../suggestionStore'
import type { EventDetector } from './types'
import { getSuggestionExpiresAt } from './suggestionExpiry'

// a newer import replaces the previous one
export const DATA_IMPORTED_SUGGESTION_ID = 'dataImported:latest'

type ImportResult = Record<string, unknown>

/**
 * Returns a positive count, or 0.
 * @param {unknown} value - A result field.
 * @returns {number} The count.
 */
const toCount = (value: unknown): number => {
  const count = Number(value)
  return Number.isFinite(count) && count > 0 ? count : 0
}

// records added or changed by each import job type (a Map: job types are not trusted object keys)
const importedRecordsCounters = new Map<string, (result: ImportResult) => number>([
  ['DataImportJob', (result) => (result.dryRun ? 0 : toCount(result.insertedRecords) + toCount(result.updatedRecords))],
  ['CollectDataImportJob', (result) => toCount(result.insertedRecords)],
  ['OdkDataImportJob', (result) => toCount(result.submittedCount)],
])

/**
 * Returns the number of records a succeeded import job added or changed.
 * @param {object} job - Serialized job.
 * @returns {number} The count; 0 for any other job or status.
 */
export const getImportedRecordsCount = (job: any): number => {
  if (!job || !JobSerialized.isSucceeded(job)) return 0
  const counter = importedRecordsCounters.get(JobSerialized.getType(job))
  const result = JobSerialized.getResult(job)
  return counter && result ? counter(result) : 0
}

/**
 * Tells whether the job belongs to the user and the survey of the generation.
 * @param {object} job - Serialized job.
 * @param {SuggestionGeneration} generation - The current generation.
 * @returns {boolean} True when it does.
 */
const isJobOfGeneration = (job: any, generation: SuggestionGeneration): boolean =>
  Number(job.surveyId) === generation.surveyId && job.userUuid === generation.userUuid

/**
 * Tells whether the pending suggestion already holds the job (the same update can arrive twice).
 * @param {SuggestionStore} store - Suggestion store.
 * @param {SuggestionGeneration} generation - The current generation.
 * @param {string} jobUuid - Job uuid.
 * @returns {boolean} True when it does.
 */
const isPendingJob = (store: SuggestionStore, generation: SuggestionGeneration, jobUuid: string): boolean =>
  store
    .getPending({ userUuid: generation.userUuid, surveyId: generation.surveyId })
    .some(
      (suggestion) =>
        suggestion.id === DATA_IMPORTED_SUGGESTION_ID && suggestion.targets.some((target) => target.key === jobUuid)
    )

/**
 * Builds the data imported suggestion.
 * @param {object} params - Parameters.
 * @param {number} params.surveyId - Survey id.
 * @param {string} params.jobUuid - Uuid of the import job.
 * @param {number} params.count - Records added or changed.
 * @param {Date} params.createdAt - Creation date.
 * @returns {AssistantSuggestion} The suggestion.
 */
export const buildDataImportedSuggestion = ({
  surveyId,
  jobUuid,
  count,
  createdAt,
}: {
  surveyId: number
  jobUuid: string
  count: number
  createdAt: Date
}): AssistantSuggestion => ({
  id: DATA_IMPORTED_SUGGESTION_ID,
  kind: 'dataImported',
  area: 'analysis',
  surveyId,
  cycle: null,
  targets: [{ key: jobUuid, count }],
  createdAt: createdAt.toISOString(),
  expiresAt: getSuggestionExpiresAt(createdAt),
})

export const dataImportedDetector: EventDetector = {
  kind: 'dataImported',
  area: 'analysis',
  needsDraft: false,
  on: ['jobSucceeded'],
  /**
   * Replaces the suggestion with the latest import of records into the active survey.
   * @param {object} event - The event.
   * @param {object} ctx - Detector context.
   * @returns {void}
   */
  handle: (event, ctx) => {
    const { generation } = ctx
    if (event.type !== 'jobSucceeded' || !generation || !ctx.availableAreas.includes('analysis')) return
    const { job } = event
    const count = getImportedRecordsCount(job)
    if (count === 0 || !isJobOfGeneration(job, generation)) return
    const jobUuid = JobSerialized.getUuid(job)
    if (isPendingJob(ctx.store, generation, jobUuid)) return
    const { userUuid, surveyId } = generation
    ctx.store.remove({ userUuid, surveyId, id: DATA_IMPORTED_SUGGESTION_ID })
    ctx.store.add({
      userUuid,
      suggestion: buildDataImportedSuggestion({ surveyId, jobUuid, count, createdAt: ctx.now() }),
    })
  },
}
