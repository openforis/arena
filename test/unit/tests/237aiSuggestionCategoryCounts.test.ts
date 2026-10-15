import type { MissingLabelsCounts } from '@common/ai/categoryItemLabels'

import { type DetectorContext, type SuggestionEvent } from '@webapp/ai/suggestions/detectors'
import { EVENT_DETECTORS } from '@webapp/ai/suggestions/registry'
import {
  categoryItemTranslationsDetector,
  createCategoryItemTranslationsDetector,
  detectCategoryItemTranslations,
} from '@webapp/ai/suggestions/detectors/categoryItemTranslations'
import type { SuggestionStore } from '@webapp/ai/suggestions/suggestionStore'
import { createGenerationStartNotifier } from '@webapp/components/ai/Assistant/suggestions/useGenerationStartedEvent'

import { buildCategoryLabelsSurvey, categoryUuidOf } from '@test/unit/utils/categoryLabelsTestUtils'
import { createDetectorContext, TEST_NOW } from '@test/unit/utils/designSuggestionTestUtils'

let survey: any
let counts: MissingLabelsCounts

beforeAll(async () => {
  survey = await buildCategoryLabelsSurvey()
  counts = { [categoryUuidOf(survey, 'species')]: { fr: 3 } }
})

/**
 * Creates a store that records setKind.
 * @returns {object} `{ store, setKind }`.
 */
const createSetKindRecorder = () => {
  const setKind = jest.fn()
  return { store: { setKind } as unknown as SuggestionStore, setKind }
}

/**
 * Creates a detector context with a controllable signal and clock.
 * @param {object} params - Parameters (see createDetectorContext), plus the generation's controller and the time.
 * @returns {DetectorContext} The context.
 */
const contextWith = ({
  controller = new AbortController(),
  time = TEST_NOW.getTime(),
  ...params
}: Parameters<typeof createDetectorContext>[0] & { controller?: AbortController; time?: number }): DetectorContext => {
  const ctx = createDetectorContext(params)
  return {
    ...ctx,
    now: () => new Date(time),
    generation: ctx.generation ? { ...ctx.generation, signal: controller.signal } : null,
  }
}

/**
 * Returns a promise and its resolve function.
 * @returns {object} `{ promise, resolve }`.
 */
const deferred = <T>() => {
  let resolve: (value: T) => void = () => undefined
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

const event = (type: SuggestionEvent['type']) => ({ type }) as SuggestionEvent

describe('category labels counts (237)', () => {
  test('fetches the counts on its events with the generation signal, and stores one suggestion per language', async () => {
    const { store, setKind } = createSetKindRecorder()
    const fetchCounts = jest.fn(async () => counts)
    const detector = createCategoryItemTranslationsDetector({ fetchCounts })
    const controller = new AbortController()
    await detector.handle(event('categoryEditorLeft'), contextWith({ survey, store, controller }))
    expect(fetchCounts).toHaveBeenCalledWith({ surveyId: 7, signal: controller.signal })
    expect(setKind).toHaveBeenCalledWith({
      userUuid: 'user-1',
      surveyId: 7,
      kind: 'categoryItemTranslations',
      suggestions: detectCategoryItemTranslations(counts, survey, { surveyId: 7, now: TEST_NOW }),
    })
    expect(detector).toMatchObject({ kind: 'categoryItemTranslations', area: 'design', needsDraft: true })
    expect([...detector.on].sort()).toEqual(
      [
        'categoriesChanged',
        'categoryEditorLeft',
        'categoryLabelsApplied',
        'generationStarted',
        'surveyInfoSaved',
      ].sort()
    )
    expect(EVENT_DETECTORS).toContain(categoryItemTranslationsDetector)
  })

  test('generationStarted, surveyInfoSaved and categoryEditorLeft are throttled per user, survey and languages; the events that change categories and a new language are not', async () => {
    const { store } = createSetKindRecorder()
    const fetchCounts = jest.fn(async () => counts)
    const detector = createCategoryItemTranslationsDetector({ fetchCounts, throttleMs: 30000 })
    const at = (time: number, onSurvey = survey) => contextWith({ survey: onSurvey, store, time })
    const t0 = TEST_NOW.getTime()

    await detector.handle(event('generationStarted'), at(t0))
    await detector.handle(event('surveyInfoSaved'), at(t0 + 1000))
    // leaving the category editor, again and again, does not fetch again within the window
    await detector.handle(event('categoryEditorLeft'), at(t0 + 2000))
    await detector.handle(event('categoryEditorLeft'), at(t0 + 2500))
    expect(fetchCounts).toHaveBeenCalledTimes(1)

    await detector.handle(event('categoriesChanged'), at(t0 + 3000))
    await detector.handle(event('categoryLabelsApplied'), at(t0 + 4000))
    expect(fetchCounts).toHaveBeenCalledTimes(3)

    // a survey info save that adds a language
    const withPortuguese = await buildCategoryLabelsSurvey({ languages: ['en', 'fr', 'es', 'pt'] })
    await detector.handle(event('surveyInfoSaved'), at(t0 + 5000, withPortuguese))
    expect(fetchCounts).toHaveBeenCalledTimes(4)

    // 30 s after the last fetch of the same key (any event's fetch counts)
    await detector.handle(event('categoryEditorLeft'), at(t0 + 33000))
    expect(fetchCounts).toHaveBeenCalledTimes(4)
    await detector.handle(event('categoryEditorLeft'), at(t0 + 34000))
    expect(fetchCounts).toHaveBeenCalledTimes(5)
  })

  test('a count that resolves after its generation ended lands nothing', async () => {
    const { store, setKind } = createSetKindRecorder()
    const pending = deferred<MissingLabelsCounts>()
    const detector = createCategoryItemTranslationsDetector({ fetchCounts: () => pending.promise })
    const controller = new AbortController()
    const handled = detector.handle(event('generationStarted'), contextWith({ survey, store, controller }))
    // survey switch, defs reload or logout
    controller.abort()
    pending.resolve(counts)
    await handled
    expect(setKind).not.toHaveBeenCalled()

    // an older answer that arrives after a newer request is dropped too
    const first = deferred<MissingLabelsCounts>()
    const second = deferred<MissingLabelsCounts>()
    const answers = [first.promise, second.promise]
    const ordered = createCategoryItemTranslationsDetector({
      fetchCounts: () => answers.shift() as Promise<MissingLabelsCounts>,
    })
    const firstHandled = ordered.handle(event('categoryEditorLeft'), contextWith({ survey, store }))
    const secondHandled = ordered.handle(event('categoryLabelsApplied'), contextWith({ survey, store }))
    second.resolve({})
    await secondHandled
    first.resolve(counts)
    await firstHandled
    expect(setKind).toHaveBeenCalledTimes(1)
    expect(setKind.mock.calls[0][0].suggestions).toEqual([])
  })

  test('a cancelled request does not throttle the next generation', async () => {
    const { store } = createSetKindRecorder()
    const pending = deferred<MissingLabelsCounts>()
    const fetchCounts = jest.fn().mockReturnValueOnce(pending.promise).mockResolvedValue(counts)
    const detector = createCategoryItemTranslationsDetector({ fetchCounts })
    const t0 = TEST_NOW.getTime()
    const controller = new AbortController()
    const first = detector.handle(event('generationStarted'), contextWith({ survey, store, controller, time: t0 }))
    // defs reload of the same survey during the count
    controller.abort()
    await detector.handle(event('generationStarted'), contextWith({ survey, store, time: t0 + 1000 }))
    expect(fetchCounts).toHaveBeenCalledTimes(2)
    pending.resolve(counts)
    await first
  })

  test('a generation abort after a successful request keeps its throttle', async () => {
    const { store } = createSetKindRecorder()
    const fetchCounts = jest.fn(async () => counts)
    const detector = createCategoryItemTranslationsDetector({ fetchCounts })
    const t0 = TEST_NOW.getTime()
    const controller = new AbortController()
    await detector.handle(event('generationStarted'), contextWith({ survey, store, controller, time: t0 }))
    controller.abort()
    await detector.handle(event('generationStarted'), contextWith({ survey, store, time: t0 + 1000 }))
    expect(fetchCounts).toHaveBeenCalledTimes(1)
  })

  test('a failed request is not throttled; nothing is fetched without draft defs the user can edit', async () => {
    const { store } = createSetKindRecorder()
    const fetchCounts = jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(counts)
    const detector = createCategoryItemTranslationsDetector({ fetchCounts })
    await detector.handle(event('generationStarted'), contextWith({ survey, store }))
    await detector.handle(event('generationStarted'), contextWith({ survey, store }))
    expect(fetchCounts).toHaveBeenCalledTimes(2)

    const idle = jest.fn(async () => counts)
    const guarded = createCategoryItemTranslationsDetector({ fetchCounts: idle })
    await guarded.handle(event('categoryEditorLeft'), contextWith({ survey, store, draft: false }))
    await guarded.handle(event('categoryEditorLeft'), contextWith({ survey, store, canEditSurvey: false }))
    await guarded.handle(event('categoryEditorLeft'), contextWith({ survey, store, noGeneration: true }))
    expect(idle).not.toHaveBeenCalled()
  })

  test('the host sends generationStarted on a new active generation; another survey drops the item refs', () => {
    const notify = jest.fn()
    const clearRefs = jest.fn()
    const notifier = createGenerationStartNotifier({ notify, clearRefs })
    const generation = (id: number, surveyId = 7) => ({ id, surveyId })

    notifier.update({ generation: generation(1), active: false })
    expect(notify).not.toHaveBeenCalled()
    expect(clearRefs).toHaveBeenCalledTimes(1)

    // the setting turned on, or Design became available, on the same generation
    notifier.update({ generation: generation(1), active: true })
    // the same input again (another render)
    notifier.update({ generation: generation(1), active: true })
    expect(notify).toHaveBeenCalledTimes(1)
    expect(notify).toHaveBeenLastCalledWith({ type: 'generationStarted' })

    // a defs reload of the same survey keeps the refs
    notifier.update({ generation: generation(2), active: true })
    expect(notify).toHaveBeenCalledTimes(2)
    expect(clearRefs).toHaveBeenCalledTimes(1)

    notifier.update({ generation: generation(3, 8), active: true })
    expect(clearRefs).toHaveBeenCalledTimes(2)
    notifier.update({ generation: null, active: true })
    expect(clearRefs).toHaveBeenCalledTimes(3)
    expect(notify).toHaveBeenCalledTimes(3)
  })
})
