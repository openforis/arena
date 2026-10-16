import {
  MAX_SEEN_MODULES,
  MAX_SURVEY_BUCKETS,
  emptySuggestionState,
  normalizeSuggestionState,
  parseSuggestionState,
  shrinkSuggestionState,
  type SuggestionUserState,
} from '@webapp/ai/suggestions/suggestionState'
import { createSuggestionStore, getSuggestionsKey } from '@webapp/ai/suggestions/suggestionStore'
import type { AssistantSuggestion } from '@webapp/ai/suggestions/types'

const NOW = new Date('2026-10-11T12:00:00.000Z')

const suggestion = (overrides: Partial<AssistantSuggestion> = {}): AssistantSuggestion => ({
  id: 'missingTranslations:fr',
  kind: 'missingTranslations',
  area: 'design',
  surveyId: 1,
  cycle: null,
  targets: [{ key: 'a:labels' }],
  createdAt: '2026-10-11T10:00:00.000Z',
  expiresAt: null,
  ...overrides,
})

const targetsOf = (count: number) => Array.from({ length: count }, (_, index) => ({ key: `t${index}` }))

const bucketKeys = (count: number) => Array.from({ length: count }, (_, index) => String(index + 1))

const manyBuckets = (count: number): SuggestionUserState => ({
  pending: Object.fromEntries(bucketKeys(count).map((bucket) => [bucket, [suggestion({ surveyId: Number(bucket) })]])),
  dismissed: Object.fromEntries(
    bucketKeys(count).map((bucket) => [bucket, { 'publishErrors:p': { kind: 'publishErrors', targets: { a: true } } }])
  ),
  inProgress: {},
  seenModules: [],
})

describe('suggestion state bounds (425)', () => {
  test('an expired pending suggestion is removed; in-progress and dismissed entries stay', () => {
    const state: SuggestionUserState = {
      pending: {
        '1': [
          suggestion({ id: 'validationErrors:0', kind: 'validationErrors', expiresAt: '2026-10-11T11:59:59.000Z' }),
          suggestion({ id: 'dataImported:latest', kind: 'dataImported', expiresAt: '2026-10-12T00:00:00.000Z' }),
          suggestion(),
        ],
        '2': [suggestion({ expiresAt: NOW.toISOString() })],
      },
      dismissed: { '1': { 'validationErrors:0': { kind: 'validationErrors', targets: { cycle: 30 } } } },
      inProgress: {
        '2': {
          'missingTranslations:fr': { kind: 'missingTranslations', conversationId: 'c1', targets: [{ key: 'a' }] },
        },
      },
      seenModules: [],
    }
    const normalized = normalizeSuggestionState(state, NOW)
    expect(normalized.pending['1'].map((item) => item.id)).toEqual(['dataImported:latest', 'missingTranslations:fr'])
    expect(normalized.pending['2']).toBeUndefined()
    expect(normalized.dismissed).toEqual(state.dismissed)
    expect(normalized.inProgress).toEqual(state.inProgress)
  })

  test('a state within the bounds is returned as it is', () => {
    const state = manyBuckets(3)
    expect(normalizeSuggestionState(state, NOW)).toBe(state)
  })

  test('survey buckets are capped to the most recent ones; the Help bucket is never dropped', () => {
    const state = manyBuckets(MAX_SURVEY_BUCKETS + 5)
    const withHelp = {
      ...state,
      pending: {
        help: [suggestion({ id: 'moduleIntro:data', kind: 'moduleIntro', area: 'help', surveyId: null })],
        ...state.pending,
      },
    }
    const normalized = normalizeSuggestionState(withHelp, NOW)
    const surveyBuckets = Object.keys(normalized.pending).filter((bucket) => bucket !== 'help')
    expect(surveyBuckets).toHaveLength(MAX_SURVEY_BUCKETS)
    // buckets without a write time (stored by an older version) count as the oldest: the lowest ids go first
    expect(surveyBuckets.at(-1)).toBe(String(MAX_SURVEY_BUCKETS + 5))
    expect(surveyBuckets).not.toContain('1')
    expect(normalized.pending.help).toHaveLength(1)
    expect(Object.keys(normalized.dismissed)).toHaveLength(MAX_SURVEY_BUCKETS)
  })

  test('the bucket being written is never dropped, even when it is the oldest survey', () => {
    const state = manyBuckets(MAX_SURVEY_BUCKETS + 3)
    const normalized = normalizeSuggestionState(state, NOW, { keepBucket: '1' })
    const surveyBuckets = Object.keys(normalized.pending)
    expect(surveyBuckets).toHaveLength(MAX_SURVEY_BUCKETS)
    expect(surveyBuckets).toContain('1')
    expect(surveyBuckets).not.toContain('2')
  })

  test('past the cap the least recently written bucket goes, not the lowest survey id', () => {
    const state = manyBuckets(MAX_SURVEY_BUCKETS + 1)
    // every bucket was written later than the previous one, except survey 1: the one used last
    const touchedAt = Object.fromEntries(
      bucketKeys(MAX_SURVEY_BUCKETS + 1).map((bucket) => [bucket, 1000 + Number(bucket)])
    )
    touchedAt['1'] = 9000
    const normalized = normalizeSuggestionState({ ...state, touchedAt }, NOW)
    const surveyBuckets = Object.keys(normalized.pending)
    expect(surveyBuckets).toContain('1')
    expect(surveyBuckets).not.toContain('2')
    expect(Object.keys(normalized.dismissed)).not.toContain('2')
    expect(Object.keys(normalized.touchedAt ?? {})).not.toContain('2')
  })

  test('a bucket without a write time is older than any bucket that has one', () => {
    const state = manyBuckets(MAX_SURVEY_BUCKETS + 1)
    const normalized = normalizeSuggestionState({ ...state, touchedAt: { '1': 5, '2': 6 } }, NOW)
    // survey 3 has no time: it goes before 1 and 2
    expect(Object.keys(normalized.pending)).not.toContain('3')
    expect(Object.keys(normalized.pending)).toContain('1')
  })

  test('the times are read from the stored state; a state stored without them still parses', () => {
    const base = { pending: {}, dismissed: {}, inProgress: {}, seenModules: [] }
    expect(parseSuggestionState(JSON.stringify(base))).toEqual(emptySuggestionState())
    const parsed = parseSuggestionState(JSON.stringify({ ...base, touchedAt: { '1': 5, '2': 'x', '3': null } }))
    expect(parsed.touchedAt).toEqual({ '1': 5 })
  })

  test('targets are not capped in normal operation: they mirror the survey, and the bucket cap is the bound', () => {
    const targets = targetsOf(300)
    const state: SuggestionUserState = {
      pending: { '1': [suggestion({ targets })] },
      dismissed: {
        '1': {
          'publishErrors:p': {
            kind: 'publishErrors',
            targets: Object.fromEntries(targetsOf(300).map((target) => [target.key, true])),
          },
        },
      },
      inProgress: {
        '1': { 'missingTranslations:fr': { kind: 'missingTranslations', conversationId: 'c1', targets } },
      },
      seenModules: [],
    }
    expect(normalizeSuggestionState(state, NOW)).toBe(state)
  })

  test('under pressure, dismissed targets that are still pending are kept; only the others are cut, oldest first', () => {
    const pendingTargets = targetsOf(80)
    const state: SuggestionUserState = {
      pending: { '1': [suggestion({ targets: pendingTargets })] },
      dismissed: {
        '1': {
          'missingTranslations:fr': {
            kind: 'missingTranslations',
            // 80 are still pending, and 100 more are gone from the survey
            targets: Object.fromEntries(
              [...targetsOf(80), ...targetsOf(100).map(({ key }) => ({ key: `gone-${key}` }))].map(({ key }) => [
                key,
                true,
              ])
            ),
          },
        },
      },
      inProgress: {},
      seenModules: [],
    }
    const level1 = shrinkSuggestionState(state, 1, NOW, { keepBucket: '1' })!
    const kept = Object.keys(level1.dismissed['1']['missingTranslations:fr'].targets)
    expect(pendingTargets.every(({ key }) => kept.includes(key))).toBe(true)
    // the others are cut to the tight cap, keeping the latest
    expect(kept.filter((key) => key.startsWith('gone-'))).toHaveLength(50)
    expect(kept).toContain('gone-t99')
    expect(kept).not.toContain('gone-t0')
    // the survey in use keeps all its pending targets
    expect(level1.pending['1'][0].targets).toHaveLength(80)
  })

  test('seen modules are capped to the latest ones', () => {
    const seenModules = Array.from({ length: MAX_SEEN_MODULES + 10 }, (_, index) => `m${index}`)
    const normalized = normalizeSuggestionState({ ...emptySuggestionState(), seenModules }, NOW)
    expect(normalized.seenModules).toHaveLength(MAX_SEEN_MODULES)
    expect(normalized.seenModules.at(-1)).toBe(`m${MAX_SEEN_MODULES + 9}`)
  })

  test('shrinking: level 1 tightens the caps, level 2 drops the dismissed entries, level 3 keeps only what is running', () => {
    const state: SuggestionUserState = {
      ...manyBuckets(MAX_SURVEY_BUCKETS),
      inProgress: {
        '1': {
          'missingTranslations:fr': { kind: 'missingTranslations', conversationId: 'c1', targets: [{ key: 'a' }] },
        },
      },
      seenModules: ['designer'],
    }
    const level1 = shrinkSuggestionState(state, 1, NOW)
    expect(level1).not.toBeNull()
    expect(Object.keys(level1!.pending).length).toBeLessThan(MAX_SURVEY_BUCKETS)
    expect(Object.keys(level1!.dismissed).length).toBeGreaterThan(0)
    const level2 = shrinkSuggestionState(state, 2, NOW)
    expect(level2!.dismissed).toEqual({})
    expect(Object.keys(level2!.pending).length).toBeGreaterThan(0)
    // the survey in use keeps its dismissals: a Dismiss that hit the quota must not undo itself
    const inUse = shrinkSuggestionState(state, 2, NOW, { keepBucket: '3' })!
    expect(Object.keys(inUse.dismissed)).toEqual(['3'])
    const level3 = shrinkSuggestionState(state, 3, NOW)
    expect(level3).toEqual({ ...emptySuggestionState(), inProgress: state.inProgress, seenModules: ['designer'] })
    expect(shrinkSuggestionState(state, 4, NOW)).toBeNull()
  })
})

describe('large surveys keep every live target and every dismissal (425)', () => {
  const userUuid = 'u1'
  const VISIBLE = { userUuid, surveyId: 1, cycle: null, availableAreas: ['design' as const], enabled: true }

  const fakeLocalStorage = () => {
    const data = new Map<string, string>()
    return {
      data,
      storage: {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => void data.set(key, value),
        removeItem: (key: string) => void data.delete(key),
      },
    }
  }

  const newStore = () => {
    const local = fakeLocalStorage()
    const store = createSuggestionStore({
      access: { getStorage: () => local.storage, addStorageListener: () => () => undefined },
      now: () => NOW,
      log: () => undefined,
    })
    return { ...local, store }
  }

  const visibleKeys = (store: ReturnType<typeof newStore>['store']) =>
    store.getVisible(VISIBLE).flatMap((item) => item.targets.map((target) => target.key))

  test('300 targets are all stored and counted; a text added past position 200 shows after Dismiss, and nothing old returns', () => {
    const { store } = newStore()
    const base = suggestion({ targets: targetsOf(300) })
    store.setKind({ userUuid, surveyId: 1, kind: 'missingTranslations', suggestions: [base] })
    expect(visibleKeys(store)).toHaveLength(300)

    store.dismiss({ userUuid, surveyId: 1, id: base.id })
    expect(visibleKeys(store)).toEqual([])

    // a new text in hierarchy order, after the position 200
    const withNew = [...targetsOf(300).slice(0, 250), { key: 'new-text' }, ...targetsOf(300).slice(250)]
    store.setKind({
      userUuid,
      surveyId: 1,
      kind: 'missingTranslations',
      suggestions: [{ ...base, targets: withNew }],
    })
    expect(visibleKeys(store)).toEqual(['new-text'])

    // dismissing it again does not bring an old dismissal back
    store.dismiss({ userUuid, surveyId: 1, id: base.id })
    store.setKind({
      userUuid,
      surveyId: 1,
      kind: 'missingTranslations',
      suggestions: [{ ...base, targets: withNew }],
    })
    expect(visibleKeys(store)).toEqual([])
  })

  test('a stored state with 300 dismissals keeps all of them through an unrelated write', () => {
    const { store, data } = newStore()
    const targets = targetsOf(300)
    const legacy: SuggestionUserState = {
      pending: { '1': [suggestion({ targets })] },
      dismissed: {
        '1': {
          'missingTranslations:fr': {
            kind: 'missingTranslations',
            targets: Object.fromEntries(targets.map((target) => [target.key, 5])),
          },
        },
      },
      inProgress: {},
      seenModules: [],
    }
    data.set(getSuggestionsKey(userUuid), JSON.stringify(legacy))
    store.markModuleSeen({ userUuid, module: 'designer' })
    const stored = JSON.parse(data.get(getSuggestionsKey(userUuid)) as string)
    expect(Object.keys(stored.dismissed['1']['missingTranslations:fr'].targets)).toHaveLength(300)
    expect(visibleKeys(store)).toEqual([])
  })

  test('a suggestion that accumulates targets keeps the newest ones', () => {
    const { store } = newStore()
    for (let index = 0; index < 250; index += 1) {
      store.add({
        userUuid,
        suggestion: suggestion({
          id: 'newEntriesDescriptions:designer',
          kind: 'newEntriesDescriptions',
          targets: [{ key: `entry-${index}` }],
        }),
      })
    }
    const keys = store.getPending({ userUuid, surveyId: 1 })[0].targets.map((target) => target.key)
    expect(keys).toHaveLength(250)
    expect(keys).toContain('entry-249')
  })
})

describe('the bucket cap keeps the surveys in use (425)', () => {
  const userUuid = 'u1'
  const data = new Map<string, string>()
  const makeStore = (clock: { time: number }) =>
    createSuggestionStore({
      access: {
        getStorage: () => ({
          getItem: (key: string) => data.get(key) ?? null,
          setItem: (key: string, value: string) => void data.set(key, value),
          removeItem: (key: string) => void data.delete(key),
        }),
        addStorageListener: () => () => undefined,
      },
      now: () => new Date(clock.time),
      log: () => undefined,
    })

  beforeEach(() => data.clear())

  test('the oldest survey goes even when its id is the highest, and the one written again stays', () => {
    const clock = { time: NOW.getTime() }
    const store = makeStore(clock)
    // survey ids 100 down to 81, written one hour apart: 100 is the oldest
    for (let index = 0; index < MAX_SURVEY_BUCKETS; index += 1) {
      store.add({ userUuid, suggestion: suggestion({ surveyId: 100 - index }) })
      clock.time += 2 * 60 * 60 * 1000
    }
    // survey 100 is used again, then a new survey arrives
    store.add({ userUuid, suggestion: suggestion({ id: 'dataImported:latest', kind: 'dataImported', surveyId: 100 }) })
    clock.time += 2 * 60 * 60 * 1000
    store.add({ userUuid, suggestion: suggestion({ surveyId: 1 }) })
    expect(store.getPending({ userUuid, surveyId: 100 }).length).toBeGreaterThan(0)
    expect(store.getPending({ userUuid, surveyId: 99 })).toEqual([])
    expect(store.getPending({ userUuid, surveyId: 1 }).length).toBeGreaterThan(0)
  })

  test('a write that changes nothing does not write again within the hour', () => {
    const clock = { time: NOW.getTime() }
    const store = makeStore(clock)
    store.add({ userUuid, suggestion: suggestion() })
    const before = data.get(getSuggestionsKey(userUuid))
    clock.time += 60 * 1000
    store.add({ userUuid, suggestion: suggestion() })
    expect(data.get(getSuggestionsKey(userUuid))).toBe(before)
  })
})
