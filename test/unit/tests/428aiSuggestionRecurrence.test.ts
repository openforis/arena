import type { DetectorContext } from '@webapp/ai/suggestions/detectors'
import { dataImportedDetector } from '@webapp/ai/suggestions/detectors/dataImported'
import { createValidationErrorsDetector } from '@webapp/ai/suggestions/detectors/validationErrors'
import type { SuggestionGeneration } from '@webapp/ai/suggestions/generation'
import {
  createSuggestionHostController,
  type SuggestionHostInput,
} from '@webapp/ai/suggestions/suggestionHostController'
import { createSuggestionStore } from '@webapp/ai/suggestions/suggestionStore'
import type { AssistantSuggestion } from '@webapp/ai/suggestions/types'

const userUuid = 'u1'
const surveyId = 7
const NOW = new Date('2026-10-11T12:00:00.000Z')
const AREAS: SuggestionHostInput['availableAreas'] = ['design', 'analysis', 'cleaning', 'help']

const newStore = () =>
  createSuggestionStore({
    access: { getStorage: () => null, addStorageListener: () => () => undefined },
    now: () => NOW,
  })

const generationOf = (overrides: Partial<SuggestionGeneration> = {}): SuggestionGeneration => ({
  id: 1,
  userUuid,
  surveyId,
  cycle: '0',
  draft: true,
  canEditSurvey: true,
  signal: new AbortController().signal,
  ...overrides,
})

const contextOf = (store: ReturnType<typeof newStore>, availableAreas = AREAS): DetectorContext => ({
  userUuid,
  generation: generationOf(),
  survey: null,
  availableAreas,
  store,
  now: () => NOW,
})

const publishErrors = (targetKeys: string[]): AssistantSuggestion => ({
  id: 'publishErrors:p',
  kind: 'publishErrors',
  area: 'design',
  surveyId,
  cycle: null,
  targets: targetKeys.map((key) => ({ key })),
  createdAt: NOW.toISOString(),
  expiresAt: null,
})

const visibleOf = (store: ReturnType<typeof newStore>) =>
  store.getVisible({ userUuid, surveyId, cycle: '0', availableAreas: AREAS, enabled: true })

describe('suggestions that occur again (428)', () => {
  test('a resolver also clears the dismissed targets of a suggestion that was dismissed as a whole', () => {
    const store = newStore()
    store.add({ userUuid, suggestion: publishErrors(['gone', 'stays']) })
    store.dismiss({ userUuid, surveyId, id: 'publishErrors:p' })
    // dismissed as a whole: nothing is pending any more
    expect(store.getPending({ userUuid, surveyId })).toEqual([])
    const controller = createSuggestionHostController({
      store,
      stateDetectors: [],
      eventDetectors: [],
      resolvers: [{ kind: 'publishErrors', isResolved: (key) => key === 'gone' }],
    })
    controller.update({
      enabled: true,
      userUuid,
      surveyId,
      generation: generationOf(),
      survey: {},
      availableAreas: AREAS,
    })
    expect(store.getTracked({ userUuid, surveyId })).toEqual([
      { id: 'publishErrors:p', kind: 'publishErrors', targetKeys: ['stays'] },
    ])
    // the fixed issue occurs again: it shows, it is not hidden forever
    store.add({ userUuid, suggestion: publishErrors(['gone']) })
    expect(visibleOf(store).map((item) => item.targets.map((target) => target.key))).toEqual([['gone']])
    controller.dispose()
  })

  test('a resolver leaves the targets of other kinds alone', () => {
    const store = newStore()
    store.add({ userUuid, suggestion: publishErrors(['gone']) })
    store.dismiss({ userUuid, surveyId, id: 'publishErrors:p' })
    const controller = createSuggestionHostController({
      store,
      stateDetectors: [],
      eventDetectors: [],
      resolvers: [{ kind: 'entityWithoutKey', isResolved: () => true }],
    })
    controller.update({
      enabled: true,
      userUuid,
      surveyId,
      generation: generationOf(),
      survey: {},
      availableAreas: AREAS,
    })
    expect(store.getTracked({ userUuid, surveyId })).toEqual([
      { id: 'publishErrors:p', kind: 'publishErrors', targetKeys: ['gone'] },
    ])
    controller.dispose()
  })

  test('validation messages: a count below the threshold forgets the dismissal, so a later count shows again', async () => {
    const store = newStore()
    const ctx = contextOf(store)
    const open = async (count: number) =>
      createValidationErrorsDetector({ countRows: async () => count }).handle(
        { type: 'validationReportOpened', cycle: '0' },
        ctx
      )
    await open(30)
    store.dismiss({ userUuid, surveyId, id: 'validationErrors:0' })
    await open(35)
    expect(visibleOf(store)).toEqual([])
    await open(5)
    expect(store.getTracked({ userUuid, surveyId })).toEqual([])
    // 35 is not 20 more than the dismissed 30, but the dismissal is gone
    await open(35)
    expect(visibleOf(store)).toEqual([expect.objectContaining({ targets: [{ key: 'cycle', count: 35 }] })])
  })

  test('data imported: a newer import forgets the dismissed targets of the older ones', async () => {
    const store = newStore()
    const ctx = contextOf(store, ['analysis'])
    const importJob = (uuid: string) => ({
      type: 'jobSucceeded' as const,
      job: {
        uuid,
        type: 'DataImportJob',
        userUuid,
        surveyId,
        succeeded: true,
        ended: true,
        result: { insertedRecords: 3, updatedRecords: 0, dryRun: false },
      },
    })
    await dataImportedDetector.handle(importJob('job-1'), ctx)
    store.dismiss({ userUuid, surveyId, id: 'dataImported:latest' })
    await dataImportedDetector.handle(importJob('job-2'), ctx)
    store.dismiss({ userUuid, surveyId, id: 'dataImported:latest' })
    await dataImportedDetector.handle(importJob('job-3'), ctx)
    expect(store.getTracked({ userUuid, surveyId })).toEqual([
      { id: 'dataImported:latest', kind: 'dataImported', targetKeys: ['job-3'] },
    ])
    expect(visibleOf(store)).toHaveLength(1)
  })

  test('data imported: the same job reported again after its dismissal stays dismissed', async () => {
    const store = newStore()
    const ctx = contextOf(store, ['analysis'])
    const event = {
      type: 'jobSucceeded' as const,
      job: {
        uuid: 'job-1',
        type: 'DataImportJob',
        userUuid,
        surveyId,
        succeeded: true,
        ended: true,
        result: { insertedRecords: 3, updatedRecords: 0, dryRun: false },
      },
    }
    await dataImportedDetector.handle(event, ctx)
    store.dismiss({ userUuid, surveyId, id: 'dataImported:latest' })
    await dataImportedDetector.handle(event, ctx)
    expect(visibleOf(store)).toEqual([])
  })
})
