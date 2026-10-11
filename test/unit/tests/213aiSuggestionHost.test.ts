import type { EventDetector, StateDetector, TargetResolver } from '@webapp/ai/suggestions/detectors'
import type { SuggestionGeneration } from '@webapp/ai/suggestions/generation'
import {
  createSuggestionHostController,
  SUGGESTION_DEBOUNCE_MS,
  type SuggestionHostInput,
} from '@webapp/ai/suggestions/suggestionHostController'
import { createSuggestionStore } from '@webapp/ai/suggestions/suggestionStore'
import type { AssistantSuggestion } from '@webapp/ai/suggestions/types'

const NOW = new Date('2026-10-11T12:00:00.000Z')
const ALL_AREAS: SuggestionHostInput['availableAreas'] = ['design', 'analysis', 'cleaning', 'help']

const newStore = () =>
  createSuggestionStore({
    access: { getStorage: () => null, addStorageListener: () => () => undefined },
    now: () => NOW,
  })

const generationOf = (id: number, overrides: Partial<SuggestionGeneration> = {}): SuggestionGeneration => ({
  id,
  userUuid: 'u1',
  surveyId: 7,
  cycle: '0',
  draft: true,
  canEditSurvey: true,
  signal: new AbortController().signal,
  ...overrides,
})

const inputOf = (overrides: Partial<SuggestionHostInput> = {}): SuggestionHostInput => ({
  enabled: true,
  userUuid: 'u1',
  surveyId: 7,
  generation: generationOf(1),
  survey: { name: 'A' },
  availableAreas: ALL_AREAS,
  ...overrides,
})

const suggestionFor = (survey: any, surveyId = 7): AssistantSuggestion => ({
  id: 'missingTranslations:fr',
  kind: 'missingTranslations',
  area: 'design',
  surveyId,
  cycle: null,
  targets: [{ key: `${survey.name}:labels` }],
  createdAt: NOW.toISOString(),
  expiresAt: null,
})

// a state detector that records the surveys it saw and reports one suggestion per survey
const recordingDetector = (overrides: Partial<StateDetector> = {}) => {
  const seen: string[] = []
  const detector: StateDetector = {
    kind: 'missingTranslations',
    area: 'design',
    needsDraft: true,
    detect: (ctx) => {
      seen.push(ctx.survey.name)
      return [suggestionFor(ctx.survey, ctx.generation?.surveyId)]
    },
    ...overrides,
  }
  return { detector, seen }
}

describe('suggestions host controller (213)', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  test('a new generation runs the state detectors at once; survey changes run them once, 1 s after the last', () => {
    const { detector, seen } = recordingDetector()
    const store = newStore()
    const controller = createSuggestionHostController({
      store,
      stateDetectors: [detector],
      eventDetectors: [],
      resolvers: [],
    })
    controller.update(inputOf())
    expect(seen).toEqual(['A'])
    expect(SUGGESTION_DEBOUNCE_MS).toBe(1000)
    const generation = generationOf(1)
    controller.update(inputOf({ generation, survey: { name: 'B' } }))
    jest.advanceTimersByTime(500)
    controller.update(inputOf({ generation, survey: { name: 'C' } }))
    jest.advanceTimersByTime(999)
    expect(seen).toEqual(['A'])
    jest.advanceTimersByTime(1)
    expect(seen).toEqual(['A', 'C'])
    expect(store.getPending({ userUuid: 'u1', surveyId: 7 }).map((item) => item.targets[0].key)).toEqual(['C:labels'])
  })

  test('the same input twice runs nothing more', () => {
    const { detector, seen } = recordingDetector()
    const controller = createSuggestionHostController({
      store: newStore(),
      stateDetectors: [detector],
      eventDetectors: [],
      resolvers: [],
    })
    const input = inputOf()
    controller.update(input)
    controller.update({ ...input })
    jest.advanceTimersByTime(5000)
    expect(seen).toEqual(['A'])
  })

  test('a survey switch or a defs reload during the debounce never runs against the old survey', () => {
    const { detector, seen } = recordingDetector()
    const controller = createSuggestionHostController({
      store: newStore(),
      stateDetectors: [detector],
      eventDetectors: [],
      resolvers: [],
    })
    const first = generationOf(1)
    controller.update(inputOf({ generation: first }))
    controller.update(inputOf({ generation: first, survey: { name: 'A2' } }))
    // the user opens survey 8 before the timer fires
    controller.update(inputOf({ generation: generationOf(2, { surveyId: 8 }), survey: { name: 'S8' } }))
    jest.advanceTimersByTime(5000)
    expect(seen).toEqual(['A', 'S8'])
    // a reload: the defs are reset (no generation), then loaded again
    controller.update(inputOf({ generation: generationOf(2, { surveyId: 8 }), survey: { name: 'S8b' } }))
    controller.update(inputOf({ generation: null, survey: null }))
    jest.advanceTimersByTime(5000)
    expect(seen).toEqual(['A', 'S8'])
    controller.update(inputOf({ generation: generationOf(3, { surveyId: 8 }), survey: { name: 'S8c' } }))
    expect(seen).toEqual(['A', 'S8', 'S8c'])
  })

  test('disposing cancels the pending run', () => {
    const { detector, seen } = recordingDetector()
    const controller = createSuggestionHostController({
      store: newStore(),
      stateDetectors: [detector],
      eventDetectors: [],
      resolvers: [],
    })
    const generation = generationOf(1)
    controller.update(inputOf({ generation }))
    controller.update(inputOf({ generation, survey: { name: 'B' } }))
    controller.dispose()
    jest.advanceTimersByTime(5000)
    expect(seen).toEqual(['A'])
  })

  test('nothing runs when the setting is off or nobody is logged in; turning it on runs at once', () => {
    const { detector, seen } = recordingDetector()
    const controller = createSuggestionHostController({
      store: newStore(),
      stateDetectors: [detector],
      eventDetectors: [],
      resolvers: [],
    })
    const generation = generationOf(1)
    controller.update(inputOf({ generation, enabled: false }))
    controller.update(inputOf({ generation, userUuid: null }))
    jest.advanceTimersByTime(5000)
    expect(seen).toEqual([])
    controller.update(inputOf({ generation }))
    expect(seen).toEqual(['A'])
  })

  test('a detector runs only when its area is available, and a Design one only on draft defs the user can edit', () => {
    const run = (input: Partial<SuggestionHostInput>) => {
      const { detector, seen } = recordingDetector()
      createSuggestionHostController({
        store: newStore(),
        stateDetectors: [detector],
        eventDetectors: [],
        resolvers: [],
      }).update(inputOf(input))
      return seen.length
    }
    expect(run({})).toBe(1)
    expect(run({ availableAreas: ['help'] })).toBe(0)
    expect(run({ generation: generationOf(1, { draft: false }) })).toBe(0)
    expect(run({ generation: generationOf(1, { canEditSurvey: false }) })).toBe(0)
  })

  test('an area that becomes available runs the detectors after the debounce', () => {
    const { detector, seen } = recordingDetector()
    const controller = createSuggestionHostController({
      store: newStore(),
      stateDetectors: [detector],
      eventDetectors: [],
      resolvers: [],
    })
    const generation = generationOf(1)
    controller.update(inputOf({ generation, availableAreas: ['help'] }))
    controller.update(inputOf({ generation, availableAreas: ['design', 'help'] }))
    jest.advanceTimersByTime(SUGGESTION_DEBOUNCE_MS)
    expect(seen).toEqual(['A'])
  })

  test('a throwing detector does not stop the others nor the resolvers', () => {
    const store = newStore()
    store.add({
      userUuid: 'u1',
      suggestion: {
        ...suggestionFor({ name: 'X' }),
        id: 'entityWithoutKey:plot',
        kind: 'entityWithoutKey',
        targets: [{ key: 'gone' }, { key: 'kept' }],
      },
    })
    const throwing: StateDetector = {
      kind: 'attributeWithoutRef',
      area: 'design',
      needsDraft: true,
      detect: () => {
        throw new Error('detector bug')
      },
    }
    const { detector, seen } = recordingDetector()
    const resolver: TargetResolver = { kind: 'entityWithoutKey', isResolved: (key) => key === 'gone' }
    const controller = createSuggestionHostController({
      store,
      stateDetectors: [throwing, detector],
      eventDetectors: [],
      resolvers: [resolver],
    })
    controller.update(inputOf())
    expect(seen).toEqual(['A'])
    const pending = store.getPending({ userUuid: 'u1', surveyId: 7 })
    expect(pending.find((item) => item.kind === 'entityWithoutKey')?.targets).toEqual([{ key: 'kept' }])
  })

  test('resolvers run only on draft defs', () => {
    const store = newStore()
    store.add({ userUuid: 'u1', suggestion: { ...suggestionFor({ name: 'X' }), targets: [{ key: 'gone' }] } })
    const resolver: TargetResolver = { kind: 'missingTranslations', isResolved: () => true }
    const controller = createSuggestionHostController({
      store,
      stateDetectors: [],
      eventDetectors: [],
      resolvers: [resolver],
    })
    controller.update(inputOf({ generation: generationOf(1, { draft: false }) }))
    expect(store.getPending({ userUuid: 'u1', surveyId: 7 })).toHaveLength(1)
    controller.update(inputOf({ generation: generationOf(2) }))
    expect(store.getPending({ userUuid: 'u1', surveyId: 7 })).toEqual([])
  })

  test('events reach the detectors listening to them; a rejecting one does not stop the next events', async () => {
    const handled: string[] = []
    const rejecting: EventDetector = {
      kind: 'publishErrors',
      area: 'design',
      needsDraft: true,
      on: ['publishClicked'],
      handle: () => Promise.reject(new Error('server down')),
    }
    const listening: EventDetector = {
      kind: 'newEntriesDescriptions',
      area: 'design',
      needsDraft: true,
      on: ['publishClicked', 'designerLeft'],
      handle: (event) => {
        handled.push(event.type)
      },
    }
    const controller = createSuggestionHostController({
      store: newStore(),
      stateDetectors: [],
      eventDetectors: [rejecting, listening],
      resolvers: [],
    })
    controller.update(inputOf())
    controller.event({ type: 'publishClicked' })
    await Promise.resolve()
    controller.event({ type: 'designerLeft', newNodeDefUuids: ['x'] })
    controller.event({ type: 'surveyInfoSaved' })
    expect(handled).toEqual(['publishClicked', 'designerLeft'])
  })

  test('without a generation only the module event is handled at once (Help), and only when Help is available', () => {
    const entered: string[] = []
    const intro: EventDetector = {
      kind: 'moduleIntro',
      area: 'help',
      needsDraft: false,
      on: ['moduleEntered', 'publishClicked'],
      handle: (event) => {
        entered.push(event.type === 'moduleEntered' ? event.module : event.type)
      },
    }
    const controller = createSuggestionHostController({
      store: newStore(),
      stateDetectors: [],
      eventDetectors: [intro],
      resolvers: [],
    })
    controller.update(inputOf({ generation: null, survey: null }))
    controller.event({ type: 'moduleEntered', module: 'designer' })
    controller.event({ type: 'publishClicked' })
    controller.update(inputOf({ generation: null, survey: null, availableAreas: ['design'] }))
    controller.event({ type: 'moduleEntered', module: 'data' })
    controller.update(inputOf({ generation: null, survey: null, enabled: false }))
    controller.event({ type: 'moduleEntered', module: 'analysis' })
    expect(entered).toEqual(['designer'])
  })

  test('an event that arrives while the defs load is handled when they are loaded, for the same user and survey only', () => {
    const handled: string[] = []
    const listening: EventDetector = {
      kind: 'publishErrors',
      area: 'design',
      needsDraft: true,
      on: ['publishClicked', 'surveyInfoSaved'],
      handle: (event, ctx) => {
        handled.push(`${event.type}@${ctx.generation?.surveyId}`)
      },
    }
    const controller = createSuggestionHostController({
      store: newStore(),
      stateDetectors: [],
      eventDetectors: [listening],
      resolvers: [],
    })
    // before the first update: a store middleware can notify before the host's first effect
    controller.event({ type: 'surveyInfoSaved' })
    controller.update(inputOf({ generation: null, survey: null }))
    controller.event({ type: 'publishClicked' })
    expect(handled).toEqual([])
    controller.update(inputOf({ generation: generationOf(1) }))
    expect(handled).toEqual(['surveyInfoSaved@7', 'publishClicked@7'])
    // handled once
    controller.update(inputOf({ generation: generationOf(2) }))
    expect(handled).toHaveLength(2)
    // an event of survey 7 is not handled for survey 8
    controller.update(inputOf({ generation: null, survey: null }))
    controller.event({ type: 'publishClicked' })
    controller.update(inputOf({ surveyId: 8, generation: generationOf(3, { surveyId: 8 }) }))
    expect(handled).toHaveLength(2)
    // the setting turned off drops the queue
    controller.update(inputOf({ generation: null, survey: null }))
    controller.event({ type: 'publishClicked' })
    controller.update(inputOf({ generation: null, survey: null, enabled: false }))
    controller.update(inputOf({ generation: generationOf(4) }))
    expect(handled).toHaveLength(2)
  })

  describe('the signal of a detector follows its area and the setting', () => {
    // an event detector of the Design area that keeps the signals of the contexts it receives
    const signalRecorder = () => {
      const signals: AbortSignal[] = []
      const detector: EventDetector = {
        kind: 'publishErrors',
        area: 'design',
        needsDraft: true,
        on: ['publishClicked'],
        handle: (_event, ctx) => {
          signals.push(ctx.generation!.signal)
        },
      }
      const controller = createSuggestionHostController({
        store: newStore(),
        stateDetectors: [],
        eventDetectors: [detector],
        resolvers: [],
      })
      return { controller, signals }
    }

    test('it aborts when the setting is turned off, with the same generation id', () => {
      const { controller, signals } = signalRecorder()
      const generation = generationOf(1)
      controller.update(inputOf({ generation }))
      controller.event({ type: 'publishClicked' })
      expect(signals[0].aborted).toBe(false)
      controller.update(inputOf({ generation, enabled: false }))
      expect(signals[0].aborted).toBe(true)
      expect(generation.signal.aborted).toBe(false)
    })

    test('it aborts when its area leaves the available areas, not when an unrelated one does', () => {
      const { controller, signals } = signalRecorder()
      const generation = generationOf(1)
      controller.update(inputOf({ generation }))
      controller.event({ type: 'publishClicked' })
      controller.update(inputOf({ generation, availableAreas: ['design', 'help'] }))
      expect(signals[0].aborted).toBe(false)
      controller.update(inputOf({ generation, availableAreas: ['analysis', 'help'] }))
      expect(signals[0].aborted).toBe(true)
    })

    test('a run after the area returns gets a fresh signal', () => {
      const { controller, signals } = signalRecorder()
      const generation = generationOf(1)
      controller.update(inputOf({ generation }))
      controller.event({ type: 'publishClicked' })
      controller.update(inputOf({ generation, availableAreas: ['help'] }))
      controller.update(inputOf({ generation }))
      controller.event({ type: 'publishClicked' })
      expect(signals).toHaveLength(2)
      expect(signals[0].aborted).toBe(true)
      expect(signals[1].aborted).toBe(false)
    })

    test('it aborts with the generation and on dispose; a state detector gets one too', () => {
      const seen: AbortSignal[] = []
      const { detector } = recordingDetector({
        detect: (ctx) => {
          seen.push(ctx.generation!.signal)
          return []
        },
      })
      const controller = createSuggestionHostController({
        store: newStore(),
        stateDetectors: [detector],
        eventDetectors: [],
        resolvers: [],
      })
      const abortController = new AbortController()
      controller.update(inputOf({ generation: generationOf(1, { signal: abortController.signal }) }))
      expect(seen[0].aborted).toBe(false)
      abortController.abort()
      expect(seen[0].aborted).toBe(true)
      controller.update(inputOf({ generation: generationOf(2) }))
      expect(seen[1].aborted).toBe(false)
      controller.dispose()
      expect(seen[1].aborted).toBe(true)
    })
  })
})
