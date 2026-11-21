import { notifyValidationReportOpened } from '@webapp/ai/suggestions/notifyValidationReportOpened'
import { createValidationErrorsDetector } from '@webapp/ai/suggestions/detectors/validationErrors'
import type { SuggestionGeneration } from '@webapp/ai/suggestions/generation'
import {
  createSuggestionHostController,
  type SuggestionHostInput,
} from '@webapp/ai/suggestions/suggestionHostController'
import { createSuggestionStore } from '@webapp/ai/suggestions/suggestionStore'

const NOW = new Date('2026-10-11T12:00:00.000Z')

const generation: SuggestionGeneration = {
  id: 1,
  userUuid: 'u1',
  surveyId: 7,
  cycle: '0',
  draft: false,
  canEditSurvey: false,
  signal: new AbortController().signal,
}

const inputOf = (overrides: Partial<SuggestionHostInput> = {}): SuggestionHostInput => ({
  enabled: true,
  userUuid: 'u1',
  surveyId: 7,
  generation,
  survey: {},
  availableAreas: ['cleaning', 'help'],
  ...overrides,
})

/**
 * Opens the report with the given host input and tells how many times the server was asked for the count.
 * @param {Partial<SuggestionHostInput>} overrides - The host input.
 * @returns {Promise<number>} The calls of the count request.
 */
const countRequestsWhenReportOpens = async (overrides: Partial<SuggestionHostInput>): Promise<number> => {
  const countRows = jest.fn(async (_params: unknown) => 500)
  const controller = createSuggestionHostController({
    store: createSuggestionStore({
      access: { getStorage: () => null, addStorageListener: () => () => undefined },
      now: () => NOW,
    }),
    stateDetectors: [],
    eventDetectors: [createValidationErrorsDetector({ countRows })],
    resolvers: [],
  })
  controller.update(inputOf(overrides))
  controller.event({ type: 'validationReportOpened', cycle: '0' })
  // the detector awaits the count: let it settle
  await Promise.resolve()
  controller.dispose()
  return countRows.mock.calls.length
}

describe('suggestions ask the server for nothing when AI is off (429)', () => {
  test('with Proactive suggestions off the report opening never reaches the count request', async () => {
    expect(await countRequestsWhenReportOpens({ enabled: false })).toBe(0)
  })

  test('without a user, or without the Cleaning area, nothing is counted', async () => {
    expect(await countRequestsWhenReportOpens({ userUuid: null })).toBe(0)
    expect(await countRequestsWhenReportOpens({ availableAreas: ['design', 'help'] })).toBe(0)
  })

  test('an event that arrived before the setting was read is dropped when the setting turns out to be off', async () => {
    const countRows = jest.fn(async (_params: unknown) => 500)
    const controller = createSuggestionHostController({
      store: createSuggestionStore({
        access: { getStorage: () => null, addStorageListener: () => () => undefined },
        now: () => NOW,
      }),
      stateDetectors: [],
      eventDetectors: [createValidationErrorsDetector({ countRows })],
      resolvers: [],
    })
    controller.event({ type: 'validationReportOpened', cycle: '0' })
    controller.update(inputOf({ enabled: false }))
    controller.update(inputOf({ enabled: true }))
    await Promise.resolve()
    expect(countRows).not.toHaveBeenCalled()
    controller.dispose()
  })

  test('with the setting on and the Cleaning area available the count is requested once', async () => {
    expect(await countRequestsWhenReportOpens({})).toBe(1)
  })

  test('the report tells the suggestions it opened only when the Cleaning area is available and a cycle is open', () => {
    const notify = jest.fn()
    // AI off (the area is not available): nothing is sent, so nothing can reach the server
    notifyValidationReportOpened({ cycle: '0', askAssistantAvailable: false, notify })
    notifyValidationReportOpened({ cycle: null, askAssistantAvailable: true, notify })
    expect(notify).not.toHaveBeenCalled()
    notifyValidationReportOpened({ cycle: '0', askAssistantAvailable: true, notify })
    expect(notify).toHaveBeenCalledWith({ type: 'validationReportOpened', cycle: '0' })
  })
})
