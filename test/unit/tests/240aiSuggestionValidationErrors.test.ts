import { type DetectorContext, type SuggestionEvent } from '@webapp/ai/suggestions/detectors'
import { EVENT_DETECTORS } from '@webapp/ai/suggestions/registry'
import { getSuggestionExpiresAt, SUGGESTION_EXPIRY_DAYS } from '@webapp/ai/suggestions/detectors/suggestionExpiry'
import {
  VALIDATION_MESSAGES_THRESHOLD,
  createValidationErrorsDetector,
  getValidationErrorsSuggestionId,
} from '@webapp/ai/suggestions/detectors/validationErrors'
import type { SuggestionGeneration } from '@webapp/ai/suggestions/generation'
import { createSuggestionStore } from '@webapp/ai/suggestions/suggestionStore'
import type { AssistantArea } from '@webapp/components/ai/Assistant/assistantAreas'

const userUuid = 'u1'
const surveyId = 7
const DAY_MS = 24 * 60 * 60 * 1000
const start = new Date('2026-10-11T10:00:00.000Z')

/**
 * Builds a detector context on an in-memory store with a controllable clock.
 * @param {object} [options] - Options.
 * @param {AssistantArea[]} [options.availableAreas] - Areas available to the user.
 * @param {boolean} [options.withGeneration] - Whether a generation is running.
 * @returns {object} The context, the store, the generation controller and helpers.
 */
const setup = ({
  availableAreas = ['cleaning'] as AssistantArea[],
  withGeneration = true,
}: { availableAreas?: AssistantArea[]; withGeneration?: boolean } = {}) => {
  let clock = start
  const now = () => clock
  const store = createSuggestionStore({ access: { getStorage: () => null, addStorageListener: () => () => {} }, now })
  const controller = new AbortController()
  const generation: SuggestionGeneration = {
    id: 1,
    userUuid,
    surveyId,
    cycle: '0',
    draft: false,
    canEditSurvey: false,
    signal: controller.signal,
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
   * Returns the visible suggestions of a cycle.
   * @param {string} [cycle] - Current cycle.
   * @returns {object[]} The suggestions.
   */
  const visible = (cycle = '0') =>
    store.getVisible({ userUuid, surveyId, cycle, availableAreas: ['cleaning'], enabled: true })
  /**
   * Returns the pending suggestions of the survey.
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
  return { ctx, store, controller, generation, visible, pending, setClock }
}

/**
 * Returns the event of a report opened in a cycle.
 * @param {string} [cycle] - Cycle key.
 * @returns {SuggestionEvent} The event.
 */
const opened = (cycle = '0'): SuggestionEvent => ({ type: 'validationReportOpened', cycle })

/**
 * Returns a countValidationReportRows stub that answers with a count.
 * @param {number} count - The count.
 * @returns {jest.Mock} The stub.
 */
const countReturning = (count: number) => jest.fn(async (_params: unknown) => count)

/**
 * Runs the detector once with a stubbed count.
 * @param {DetectorContext} ctx - Detector context.
 * @param {number} count - Count answered by the server.
 * @param {SuggestionEvent} [event] - Event.
 * @returns {Promise<jest.Mock>} The count stub.
 */
const openWithCount = async (ctx: DetectorContext, count: number, event: SuggestionEvent = opened()) => {
  const countRows = countReturning(count)
  await createValidationErrorsDetector({ countRows }).handle(event, ctx)
  return countRows
}

describe('validation errors suggestion detector (240)', () => {
  test('constants of the spec', () => {
    expect(VALIDATION_MESSAGES_THRESHOLD).toBe(20)
    expect(SUGGESTION_EXPIRY_DAYS).toBe(7)
    expect(getValidationErrorsSuggestionId('2')).toBe('validationErrors:2')
    expect(getSuggestionExpiresAt(start)).toBe('2026-10-18T10:00:00.000Z')
  })

  test('counts the whole cycle without filters and offers a summary from 20 messages', async () => {
    const { ctx, controller, visible } = setup()
    const countRows = await openWithCount(ctx, 20)
    expect(countRows).toHaveBeenCalledTimes(1)
    expect(countRows).toHaveBeenCalledWith({ surveyId: 7, cycle: '0', signal: controller.signal })
    expect(visible()).toEqual([
      {
        id: 'validationErrors:0',
        kind: 'validationErrors',
        area: 'cleaning',
        surveyId: 7,
        cycle: '0',
        targets: [{ key: 'cycle', count: 20 }],
        createdAt: '2026-10-11T10:00:00.000Z',
        expiresAt: '2026-10-18T10:00:00.000Z',
      },
    ])
  })

  test('19 messages: no suggestion', async () => {
    const { ctx, pending } = setup()
    await openWithCount(ctx, 19)
    expect(pending()).toEqual([])
  })

  test('shown only in its cycle', async () => {
    const { ctx, visible } = setup()
    await openWithCount(ctx, 412)
    expect(visible('0')).toHaveLength(1)
    expect(visible('1')).toEqual([])
  })

  test('replaced on every open (new count and expiry), removed below the threshold', async () => {
    const { ctx, visible, pending, setClock } = setup()
    await openWithCount(ctx, 412)
    const later = new Date(start.getTime() + DAY_MS)
    setClock(later)
    await openWithCount(ctx, 30)
    expect(pending()).toHaveLength(1)
    expect(visible()).toEqual([
      expect.objectContaining({
        targets: [{ key: 'cycle', count: 30 }],
        createdAt: later.toISOString(),
        expiresAt: getSuggestionExpiresAt(later),
      }),
    ])
    await openWithCount(ctx, 19)
    expect(pending()).toEqual([])
  })

  test('expires 7 days after the last open', async () => {
    const { ctx, visible, setClock } = setup()
    await openWithCount(ctx, 412)
    setClock(new Date(start.getTime() + 7 * DAY_MS + 1))
    expect(visible()).toEqual([])
  })

  test('dismissed: back only when the count grows by 20 or more', async () => {
    const { ctx, store, visible } = setup()
    await openWithCount(ctx, 30)
    store.dismiss({ userUuid, surveyId, id: 'validationErrors:0' })
    expect(visible()).toEqual([])
    await openWithCount(ctx, 30)
    expect(visible()).toEqual([])
    await openWithCount(ctx, 49)
    expect(visible()).toEqual([])
    await openWithCount(ctx, 50)
    expect(visible()).toEqual([expect.objectContaining({ targets: [{ key: 'cycle', count: 50 }] })])
  })

  test('in progress: reopening the report does not show it again', async () => {
    const { ctx, store, visible } = setup()
    await openWithCount(ctx, 30)
    store.startProgress({ userUuid, surveyId, id: 'validationErrors:0', conversationId: 'c1' })
    await openWithCount(ctx, 35)
    expect(visible()).toEqual([])
  })

  test('a report of another cycle keeps the suggestion of this cycle and its dismissal', async () => {
    const { ctx, store, generation, pending, visible } = setup()
    await openWithCount(ctx, 30)
    store.dismiss({ userUuid, surveyId, id: 'validationErrors:0' })
    const ctxCycle1: DetectorContext = { ...ctx, generation: { ...generation, id: 2, cycle: '1' } }
    await openWithCount(ctxCycle1, 25, opened('1'))
    expect(pending().map((suggestion) => suggestion.id)).toContain('validationErrors:1')
    expect(visible('1')).toHaveLength(1)
    await openWithCount(ctx, 30)
    expect(visible('0')).toEqual([])
  })

  test('nothing without the Cleaning area, without a generation, or for another cycle', async () => {
    const noArea = setup({ availableAreas: ['analysis'] })
    expect(await openWithCount(noArea.ctx, 500)).not.toHaveBeenCalled()
    const noGeneration = setup({ withGeneration: false })
    expect(await openWithCount(noGeneration.ctx, 500)).not.toHaveBeenCalled()
    const otherCycle = setup()
    expect(await openWithCount(otherCycle.ctx, 500, opened('1'))).not.toHaveBeenCalled()
    expect(otherCycle.pending()).toEqual([])
  })

  test('other events are ignored', async () => {
    const { ctx } = setup()
    const countRows = await openWithCount(ctx, 500, { type: 'publishClicked' })
    expect(countRows).not.toHaveBeenCalled()
  })

  test('a failed, late or invalid count leaves nothing', async () => {
    const failed = setup()
    const rejecting = jest.fn(async (_params: unknown): Promise<number> => {
      throw new Error('Request failed with status code 500')
    })
    await expect(
      createValidationErrorsDetector({ countRows: rejecting }).handle(opened(), failed.ctx)
    ).resolves.toBeUndefined()
    expect(failed.pending()).toEqual([])

    const late = setup()
    let answer: (count: number) => void = () => {}
    const deferred = jest.fn((_params: unknown) => new Promise<number>((resolve) => (answer = resolve)))
    const handling = createValidationErrorsDetector({ countRows: deferred }).handle(opened(), late.ctx)
    late.controller.abort() // the user switched survey or cycle
    answer(500)
    await handling
    expect(late.pending()).toEqual([])

    const invalid = setup()
    await openWithCount(invalid.ctx, Number.NaN)
    expect(invalid.pending()).toEqual([])
  })

  test('registered among the event detectors', () => {
    const detector = EVENT_DETECTORS.find((candidate) => candidate.kind === 'validationErrors')
    expect(detector).toMatchObject({ area: 'cleaning', needsDraft: false, on: ['validationReportOpened'] })
  })
})
