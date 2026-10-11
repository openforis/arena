import { EVENT_DETECTORS, type DetectorContext, type SuggestionEvent } from '@webapp/ai/suggestions/detectors'
import {
  DATA_IMPORTED_SUGGESTION_ID,
  dataImportedDetector,
  getImportedRecordsCount,
} from '@webapp/ai/suggestions/detectors/dataImported'
import type { SuggestionGeneration } from '@webapp/ai/suggestions/generation'
import { createSuggestionStore } from '@webapp/ai/suggestions/suggestionStore'
import type { AssistantArea } from '@webapp/components/ai/Assistant/assistantAreas'

const userUuid = 'u1'
const surveyId = 7
const DAY_MS = 24 * 60 * 60 * 1000
const start = new Date('2026-10-11T10:00:00.000Z')

/**
 * Returns a serialized succeeded import job (as pushed by the server).
 * @param {object} [overrides] - Fields to override.
 * @returns {object} The job.
 */
const job = (overrides: Record<string, unknown> = {}) => ({
  uuid: 'job-1',
  type: 'DataImportJob',
  userUuid,
  surveyId,
  succeeded: true,
  ended: true,
  result: { insertedRecords: 3, updatedRecords: 2, dryRun: false },
  ...overrides,
})

/**
 * Returns the event of a succeeded job.
 * @param {object} jobSerialized - The job.
 * @returns {SuggestionEvent} The event.
 */
const succeeded = (jobSerialized: object): SuggestionEvent => ({ type: 'jobSucceeded', job: jobSerialized })

/**
 * Builds a detector context on an in-memory store with a controllable clock.
 * @param {object} [options] - Options.
 * @param {AssistantArea[]} [options.availableAreas] - Areas available to the user.
 * @param {boolean} [options.withGeneration] - Whether a generation is running.
 * @returns {object} The context, the store and helpers.
 */
const setup = ({
  availableAreas = ['analysis'] as AssistantArea[],
  withGeneration = true,
}: { availableAreas?: AssistantArea[]; withGeneration?: boolean } = {}) => {
  let clock = start
  const now = () => clock
  const store = createSuggestionStore({ access: { getStorage: () => null, addStorageListener: () => () => {} }, now })
  const generation: SuggestionGeneration = {
    id: 1,
    userUuid,
    surveyId,
    cycle: '0',
    draft: false,
    canEditSurvey: false,
    signal: new AbortController().signal,
  }
  const ctx: DetectorContext = {
    userUuid,
    generation: withGeneration ? generation : null,
    survey: null,
    availableAreas,
    store,
    now,
  }
  /**
   * Returns the visible suggestions.
   * @returns {object[]} The suggestions.
   */
  const visible = () =>
    store.getVisible({ userUuid, surveyId, cycle: '0', availableAreas: ['analysis'], enabled: true })
  /**
   * Returns the pending suggestions.
   * @returns {object[]} The suggestions.
   */
  const pending = () => store.getPending({ userUuid, surveyId })
  /**
   * Moves the clock.
   * @param {Date} date - New date.
   * @returns {void}
   */
  const setClock = (date: Date) => {
    clock = date
  }
  return { ctx, store, visible, pending, setClock }
}

describe('data imported suggestion detector (242)', () => {
  test.each([
    ['DataImportJob', { insertedRecords: 3, updatedRecords: 2, dryRun: false }, 5],
    ['DataImportJob', { insertedRecords: 3, updatedRecords: 0, dryRun: true }, 0],
    ['DataImportJob', { insertedRecords: 0, updatedRecords: 0, dryRun: false }, 0],
    ['CollectDataImportJob', { insertedRecords: 4 }, 4],
    ['CollectDataImportJob', { insertedRecords: 0 }, 0],
    ['OdkDataImportJob', { submittedCount: 6, skippedCount: 1 }, 6],
    ['OdkDataImportJob', { submittedCount: 0, skippedCount: 2 }, 0],
    ['DataImportValidationJob', { insertedRecords: 3 }, 0],
    ['ArenaMobileDataImportJob', { insertedRecords: 3 }, 0],
    ['toString', { insertedRecords: 3 }, 0],
  ])('%s %j counts %i records', (type, result, expected) => {
    expect(getImportedRecordsCount(job({ type, result }))).toBe(expected)
  })

  test('only succeeded jobs with a result count', () => {
    expect(getImportedRecordsCount(job({ succeeded: false, failed: true }))).toBe(0)
    expect(getImportedRecordsCount(job({ result: null }))).toBe(0)
    expect(getImportedRecordsCount(null)).toBe(0)
  })

  test('a succeeded import of the active survey offers an overview in Analysis', async () => {
    const { ctx, visible } = setup()
    await dataImportedDetector.handle(succeeded(job()), ctx)
    expect(visible()).toEqual([
      {
        id: 'dataImported:latest',
        kind: 'dataImported',
        area: 'analysis',
        surveyId: 7,
        cycle: null,
        targets: [{ key: 'job-1', count: 5 }],
        createdAt: '2026-10-11T10:00:00.000Z',
        expiresAt: '2026-10-18T10:00:00.000Z',
      },
    ])
    expect(DATA_IMPORTED_SUGGESTION_ID).toBe('dataImported:latest')
  })

  test('the survey id may come as a string', async () => {
    const { ctx, pending } = setup()
    await dataImportedDetector.handle(succeeded(job({ surveyId: '7' })), ctx)
    expect(pending()).toHaveLength(1)
  })

  test('nothing for another survey, another user, or a job that imported nothing', async () => {
    const { ctx, pending } = setup()
    await dataImportedDetector.handle(succeeded(job({ surveyId: 8 })), ctx)
    await dataImportedDetector.handle(succeeded(job({ userUuid: 'u2' })), ctx)
    await dataImportedDetector.handle(succeeded(job({ result: { insertedRecords: 0, updatedRecords: 0 } })), ctx)
    await dataImportedDetector.handle(succeeded(job({ type: 'SurveyPublishJob', result: {} })), ctx)
    expect(pending()).toEqual([])
  })

  test('nothing without a generation, without the Analysis area, or for another event', async () => {
    const noGeneration = setup({ withGeneration: false })
    await dataImportedDetector.handle(succeeded(job()), noGeneration.ctx)
    expect(noGeneration.pending()).toEqual([])
    const noArea = setup({ availableAreas: ['cleaning'] })
    await dataImportedDetector.handle(succeeded(job()), noArea.ctx)
    expect(noArea.pending()).toEqual([])
    const otherEvent = setup()
    await dataImportedDetector.handle({ type: 'validationReportOpened', cycle: '0' }, otherEvent.ctx)
    expect(otherEvent.pending()).toEqual([])
  })

  test('a newer import replaces the previous one', async () => {
    const { ctx, pending } = setup()
    await dataImportedDetector.handle(succeeded(job()), ctx)
    await dataImportedDetector.handle(
      succeeded(job({ uuid: 'job-2', type: 'CollectDataImportJob', result: { insertedRecords: 9 } })),
      ctx
    )
    expect(pending()).toEqual([
      expect.objectContaining({ id: 'dataImported:latest', targets: [{ key: 'job-2', count: 9 }] }),
    ])
  })

  test('the same job reported twice keeps the suggestion as it is', async () => {
    const { ctx, pending, setClock } = setup()
    await dataImportedDetector.handle(succeeded(job()), ctx)
    setClock(new Date(start.getTime() + 60_000))
    await dataImportedDetector.handle(succeeded(job()), ctx)
    expect(pending()).toEqual([expect.objectContaining({ createdAt: start.toISOString() })])
  })

  test('a dismissed import stays dismissed when its update comes again; a new import shows', async () => {
    const { ctx, store, visible } = setup()
    await dataImportedDetector.handle(succeeded(job()), ctx)
    store.dismiss({ userUuid, surveyId, id: 'dataImported:latest' })
    await dataImportedDetector.handle(succeeded(job()), ctx)
    expect(visible()).toEqual([])
    await dataImportedDetector.handle(succeeded(job({ uuid: 'job-2' })), ctx)
    expect(visible()).toEqual([expect.objectContaining({ targets: [{ key: 'job-2', count: 5 }] })])
  })

  test('expires 7 days after the import', async () => {
    const { ctx, visible, setClock } = setup()
    await dataImportedDetector.handle(succeeded(job()), ctx)
    setClock(new Date(start.getTime() + 7 * DAY_MS + 1))
    expect(visible()).toEqual([])
  })

  test('registered among the event detectors', () => {
    const detector = EVENT_DETECTORS.find((candidate) => candidate.kind === 'dataImported')
    expect(detector).toBe(dataImportedDetector)
    expect(detector).toMatchObject({ area: 'analysis', needsDraft: false, on: ['jobSucceeded'] })
  })
})
