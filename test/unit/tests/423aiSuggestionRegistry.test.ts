import {
  EVENT_DETECTORS,
  STATE_DETECTORS,
  SUGGESTION_DEFINITIONS,
  SUGGESTION_REGISTRY,
  TARGET_RESOLVERS,
} from '@webapp/ai/suggestions/registry'
import { SUGGESTION_GROWTH_STEPS, isSuggestionKind, type SuggestionKind } from '@webapp/ai/suggestions/types'

const kinds = Object.keys(SUGGESTION_GROWTH_STEPS) as SuggestionKind[]

describe('suggestion registry (423)', () => {
  test('every kind is registered once, and the entry holds its own definition, detector and resolver', () => {
    expect(Object.keys(SUGGESTION_REGISTRY).sort()).toEqual([...kinds].sort())
    for (const kind of kinds) {
      const { definition, stateDetector, eventDetector, resolver } = SUGGESTION_REGISTRY[kind]
      const entryKinds = [definition, stateDetector, eventDetector, resolver].map((part) => part?.kind ?? kind)
      expect(entryKinds).toEqual([kind, kind, kind, kind])
    }
  })

  test('every kind is created by exactly one detector, state or event', () => {
    for (const kind of kinds) {
      const { stateDetector, eventDetector } = SUGGESTION_REGISTRY[kind]
      expect([kind, Number(!!stateDetector) + Number(!!eventDetector)]).toEqual([kind, 1])
    }
  })

  test('the definitions map is complete and the arrays hold what the entries declare', () => {
    expect(Object.keys(SUGGESTION_DEFINITIONS).sort()).toEqual([...kinds].sort())
    const registrations = Object.values(SUGGESTION_REGISTRY)
    expect(STATE_DETECTORS).toEqual(registrations.flatMap((entry) => entry.stateDetector ?? []))
    expect(EVENT_DETECTORS).toEqual(registrations.flatMap((entry) => entry.eventDetector ?? []))
    expect(TARGET_RESOLVERS).toEqual(registrations.flatMap((entry) => entry.resolver ?? []))
    expect(STATE_DETECTORS.length + EVENT_DETECTORS.length).toBe(kinds.length)
  })

  test('a kind is a key of the table, not an inherited property', () => {
    expect(isSuggestionKind('missingTranslations')).toBe(true)
    for (const value of ['constructor', 'toString', '__proto__', 'unknown', '', null, 3]) {
      expect(isSuggestionKind(value)).toBe(false)
    }
  })

  test('growth steps: only the counted kinds have one', () => {
    expect(Object.fromEntries(Object.entries(SUGGESTION_GROWTH_STEPS).filter(([, step]) => step !== null))).toEqual({
      categoryItemTranslations: 10,
      validationErrors: 20,
    })
  })
})
