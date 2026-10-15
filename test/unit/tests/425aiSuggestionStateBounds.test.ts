import {
  MAX_DISMISSED_PER_SUGGESTION,
  MAX_SEEN_MODULES,
  MAX_SURVEY_BUCKETS,
  MAX_TARGETS_PER_ENTRY,
  emptySuggestionState,
  normalizeSuggestionState,
  shrinkSuggestionState,
  type SuggestionUserState,
} from '@webapp/ai/suggestions/suggestionState'
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
    // bucket keys are survey ids, kept in ascending order: the lowest ids (the oldest surveys) go
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

  test('targets are capped per pending suggestion, per in-progress entry and per dismissed suggestion', () => {
    const state: SuggestionUserState = {
      pending: { '1': [suggestion({ targets: targetsOf(MAX_TARGETS_PER_ENTRY + 50) })] },
      dismissed: {
        '1': {
          'publishErrors:p': {
            kind: 'publishErrors',
            targets: Object.fromEntries(
              targetsOf(MAX_DISMISSED_PER_SUGGESTION + 30).map((target) => [target.key, true])
            ),
          },
        },
      },
      inProgress: {
        '1': {
          'missingTranslations:fr': {
            kind: 'missingTranslations',
            conversationId: 'c1',
            targets: targetsOf(MAX_TARGETS_PER_ENTRY + 1),
          },
        },
      },
      seenModules: [],
    }
    const normalized = normalizeSuggestionState(state, NOW)
    expect(normalized.pending['1'][0].targets).toHaveLength(MAX_TARGETS_PER_ENTRY)
    const dismissedKeys = Object.keys(normalized.dismissed['1']['publishErrors:p'].targets)
    expect(dismissedKeys).toHaveLength(MAX_DISMISSED_PER_SUGGESTION)
    // the most recent dismissals are kept
    expect(dismissedKeys.at(-1)).toBe(`t${MAX_DISMISSED_PER_SUGGESTION + 29}`)
    expect(normalized.inProgress['1']['missingTranslations:fr'].targets).toHaveLength(MAX_TARGETS_PER_ENTRY)
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
    const level3 = shrinkSuggestionState(state, 3, NOW)
    expect(level3).toEqual({ ...emptySuggestionState(), inProgress: state.inProgress, seenModules: ['designer'] })
    expect(shrinkSuggestionState(state, 4, NOW)).toBeNull()
  })
})
