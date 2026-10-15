import {
  emptySuggestionState,
  getTrackedOf,
  parseSuggestionState,
  withAdded,
  withDismissed,
  withKind,
  withProgress,
  type SuggestionUserState,
} from '@webapp/ai/suggestions/suggestionState'
import type { AssistantSuggestion } from '@webapp/ai/suggestions/types'

const suggestion = (overrides: Partial<AssistantSuggestion> = {}): AssistantSuggestion => ({
  id: 'missingTranslations:fr',
  kind: 'missingTranslations',
  area: 'design',
  surveyId: 1,
  cycle: null,
  targets: [{ key: 'a:labels' }, { key: 'b:labels' }],
  createdAt: '2026-10-11T10:00:00.000Z',
  expiresAt: null,
  ...overrides,
})

const roundTrip = (state: SuggestionUserState): SuggestionUserState => parseSuggestionState(JSON.stringify(state))

describe('suggestion state: the stored kind (424)', () => {
  test('a dismissal and an in-progress entry store the kind of their suggestion, whatever the id looks like', () => {
    const odd = suggestion({ id: 'custom-id', kind: 'newEntriesDescriptions' })
    const added = withAdded(emptySuggestionState(), odd)
    const dismissed = withDismissed(added, { bucket: '1', id: 'custom-id' })
    expect(dismissed.dismissed).toEqual({
      '1': { 'custom-id': { kind: 'newEntriesDescriptions', targets: { 'a:labels': true, 'b:labels': true } } },
    })
    const progress = withProgress(added, { bucket: '1', id: 'custom-id', conversationId: 'c1' })
    expect(progress.inProgress['1']['custom-id']).toEqual({
      kind: 'newEntriesDescriptions',
      conversationId: 'c1',
      targets: odd.targets,
    })
    expect(roundTrip(dismissed)).toEqual(dismissed)
    expect(roundTrip(progress)).toEqual(progress)
  })

  test('a state stored before the kind was kept is read with the kind of the id prefix, once', () => {
    const legacy = {
      pending: {},
      dismissed: {
        '1': {
          'missingTranslations:fr': { 'a:labels': true },
          'validationErrors:0': { cycle: 30 },
        },
      },
      inProgress: {
        '1': { 'categoryItemTranslations:fr': { conversationId: 'c1', targets: [{ key: 'x', count: 4 }] } },
      },
      seenModules: [],
    }
    const parsed = parseSuggestionState(JSON.stringify(legacy))
    expect(parsed.dismissed).toEqual({
      '1': {
        'missingTranslations:fr': { kind: 'missingTranslations', targets: { 'a:labels': true } },
        'validationErrors:0': { kind: 'validationErrors', targets: { cycle: 30 } },
      },
    })
    expect(parsed.inProgress['1']['categoryItemTranslations:fr']).toEqual({
      kind: 'categoryItemTranslations',
      conversationId: 'c1',
      targets: [{ key: 'x', count: 4 }],
    })
  })

  test('a legacy dismissed entry whose target is named "kind" or "targets" is not mistaken for the new shape', () => {
    const parsed = parseSuggestionState(
      JSON.stringify({ dismissed: { '1': { 'publishErrors:x': { kind: true, targets: 3 } } } })
    )
    expect(parsed.dismissed).toEqual({
      '1': { 'publishErrors:x': { kind: 'publishErrors', targets: { kind: true, targets: 3 } } },
    })
  })

  test('entries of a kind this version does not know are dropped (pending, dismissed and in progress)', () => {
    const parsed = parseSuggestionState(
      JSON.stringify({
        pending: { '1': [suggestion(), suggestion({ id: 'bogus:x', kind: 'bogus' as never })] },
        dismissed: {
          '1': {
            'bogus:x': { 'a:labels': true },
            noPrefix: { 'a:labels': true },
            'constructor:x': { 'a:labels': true },
            'x:y': { kind: 'bogus', targets: { a: true } },
          },
        },
        inProgress: { '1': { 'bogus:x': { conversationId: 'c1', targets: [{ key: 'a' }] } } },
      })
    )
    expect(parsed.pending['1'].map((item) => item.id)).toEqual(['missingTranslations:fr'])
    expect(parsed.dismissed).toEqual({})
    expect(parsed.inProgress).toEqual({})
  })

  test('withKind prunes dismissed and in-progress entries by their stored kind, not by the id prefix', () => {
    const state: SuggestionUserState = {
      ...emptySuggestionState(),
      dismissed: {
        '1': {
          'cat-fr': { kind: 'categoryItemTranslations', targets: { x: 4, y: 6 } },
          'categoryItemTranslations:de': { kind: 'validationErrors', targets: { cycle: 30 } },
        },
      },
      inProgress: {
        '1': {
          'cat-fr': { kind: 'categoryItemTranslations', conversationId: 'c1', targets: [{ key: 'x' }, { key: 'y' }] },
        },
      },
    }
    const gap = suggestion({
      id: 'cat-fr',
      kind: 'categoryItemTranslations',
      area: 'design',
      targets: [{ key: 'x', count: 5 }],
    })
    const pruned = withKind(state, { bucket: '1', kind: 'categoryItemTranslations', suggestions: [gap] })
    expect(pruned.dismissed['1']['cat-fr']).toEqual({ kind: 'categoryItemTranslations', targets: { x: 4 } })
    expect(pruned.inProgress['1']['cat-fr'].targets).toEqual([{ key: 'x' }])
    // another kind with a misleading id is left alone
    expect(pruned.dismissed['1']['categoryItemTranslations:de']).toEqual(
      state.dismissed['1']['categoryItemTranslations:de']
    )
    const resolved = withKind(state, { bucket: '1', kind: 'categoryItemTranslations', suggestions: [] })
    expect(Object.keys(resolved.dismissed['1'])).toEqual(['categoryItemTranslations:de'])
    expect(resolved.inProgress).toEqual({})
  })

  test('getTrackedOf lists every id the state holds for a bucket, with its kind and the target keys of all three parts', () => {
    const state: SuggestionUserState = {
      ...withAdded(emptySuggestionState(), suggestion({ id: 'publishErrors:p', kind: 'publishErrors' })),
      dismissed: {
        '1': {
          'publishErrors:p': { kind: 'publishErrors', targets: { 'c:labels': true } },
          'entityWithoutKey:e': { kind: 'entityWithoutKey', targets: { e1: true } },
        },
        '2': { 'publishErrors:other': { kind: 'publishErrors', targets: { z: true } } },
      },
      inProgress: {
        '1': { 'publishErrors:p': { kind: 'publishErrors', conversationId: 'c1', targets: [{ key: 'a:labels' }] } },
      },
    }
    const tracked = getTrackedOf(state, '1')
    expect(tracked.map((item) => [item.id, item.kind]).sort()).toEqual([
      ['entityWithoutKey:e', 'entityWithoutKey'],
      ['publishErrors:p', 'publishErrors'],
    ])
    const publish = tracked.find((item) => item.id === 'publishErrors:p')
    expect([...(publish?.targetKeys ?? [])].sort()).toEqual(['a:labels', 'b:labels', 'c:labels'])
    expect(getTrackedOf(state, 'none')).toEqual([])
  })
})
