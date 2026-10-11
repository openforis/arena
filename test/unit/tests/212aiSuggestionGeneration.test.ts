import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { SUGGESTION_DEFINITIONS } from '@webapp/ai/suggestions/definitions'
import { EVENT_DETECTORS, STATE_DETECTORS, TARGET_RESOLVERS } from '@webapp/ai/suggestions/detectors'
import { nextDesignerVisit, type DesignerVisit } from '@webapp/ai/suggestions/designerVisit'
import {
  createGenerationTracker,
  toGenerationInput,
  type SuggestionGeneration,
  type SuggestionGenerationInput,
} from '@webapp/ai/suggestions/generation'
import { notifySuggestionEvent, subscribeSuggestionEvents } from '@webapp/ai/suggestions/suggestionEvents'
import * as SurveyStatusState from '@webapp/store/survey/status/state'

import { buildAssistantSurvey, getDefByName } from '@test/unit/utils/assistantTestUtils'

const input = (overrides: Partial<SuggestionGenerationInput> = {}): SuggestionGenerationInput => ({
  userUuid: 'u1',
  surveyId: 7,
  cycle: '0',
  draft: true,
  canEditSurvey: true,
  loadCount: 1,
  ...overrides,
})

const generationOf = (overrides: Partial<SuggestionGeneration> = {}): SuggestionGeneration => ({
  id: 1,
  userUuid: 'u1',
  surveyId: 7,
  cycle: '0',
  draft: true,
  canEditSurvey: true,
  signal: new AbortController().signal,
  ...overrides,
})

// a copy of cluster_notes with another uuid and name; temporary: created but not saved yet
const withNewDef = (survey: any, uuid: string, temporary = false): any => {
  const source = getDefByName(survey, 'cluster_notes')
  const nodeDef = { ...source, uuid, id: undefined, temporary, props: { ...source.props, name: `def_${uuid}` } }
  return Survey.assocNodeDef({ nodeDef })(survey)
}

describe('suggestion events, registries, generation and designer visit (212)', () => {
  test('events reach every subscriber, a failing one included, until it unsubscribes', () => {
    const received: string[] = []
    const failing = subscribeSuggestionEvents(() => {
      throw new Error('detector bug')
    })
    const unsubscribe = subscribeSuggestionEvents((event) => received.push(event.type))
    notifySuggestionEvent({ type: 'publishClicked' })
    unsubscribe()
    failing()
    notifySuggestionEvent({ type: 'surveyInfoSaved' })
    expect(received).toEqual(['publishClicked'])
  })

  test('registries: one detector per kind and array, and a definition for every detected kind', () => {
    for (const registry of [STATE_DETECTORS, EVENT_DETECTORS, TARGET_RESOLVERS]) {
      const kinds = registry.map((item) => item.kind)
      expect(new Set(kinds).size).toBe(kinds.length)
    }
    for (const detector of [...STATE_DETECTORS, ...EVENT_DETECTORS]) {
      expect([detector.kind, SUGGESTION_DEFINITIONS[detector.kind]?.kind]).toEqual([detector.kind, detector.kind])
    }
  })

  test('a generation needs a user, a survey, a cycle and fetched defs', () => {
    const raw = {
      userUuid: 'u1',
      surveyId: 7,
      cycle: '0',
      fetched: true,
      draft: false,
      canEditSurvey: false,
      loadCount: 2,
    }
    expect(toGenerationInput(raw)).toEqual({
      userUuid: 'u1',
      surveyId: 7,
      cycle: '0',
      draft: false,
      canEditSurvey: false,
      loadCount: 2,
    })
    expect(toGenerationInput({ ...raw, userUuid: null })).toBeNull()
    expect(toGenerationInput({ ...raw, surveyId: null })).toBeNull()
    // the active survey id (Survey.getId) can be a numeric string
    expect(toGenerationInput({ ...raw, surveyId: '7' })?.surveyId).toBe(7)
    for (const bad of ['abc', '', ' ', '0', 0, -1, '1.5'])
      expect(toGenerationInput({ ...raw, surveyId: bad })).toBeNull()
    expect(toGenerationInput({ ...raw, cycle: null })).toBeNull()
    expect(toGenerationInput({ ...raw, fetched: false })).toBeNull()
  })

  test('the tracker keeps a generation while nothing changes and ends it on any change', () => {
    const tracker = createGenerationTracker()
    const first = tracker.next(input())
    expect(first).toMatchObject({ id: 1, userUuid: 'u1', surveyId: 7, cycle: '0', draft: true, canEditSurvey: true })
    expect(tracker.next(input())).toBe(first)
    const changes: Partial<SuggestionGenerationInput>[] = [
      { userUuid: 'u2' },
      { surveyId: 8 },
      { cycle: '1' },
      { draft: false },
      { canEditSurvey: false },
      { loadCount: 2 },
    ]
    let previous = first
    for (const change of changes) {
      const next = tracker.next(input(change))
      expect(previous?.signal.aborted).toBe(true)
      expect(next?.id).toBe((previous?.id ?? 0) + 1)
      expect(next?.signal.aborted).toBe(false)
      previous = next
    }
    expect(tracker.next(null)).toBeNull()
    expect(previous?.signal.aborted).toBe(true)
    const restarted = tracker.next(input())
    tracker.end()
    expect(restarted?.signal.aborted).toBe(true)
  })

  test('designer visit: the snapshot waits for the defs, and leaving reports the new saved entries', async () => {
    const survey = await buildAssistantSurvey()
    const generation = generationOf()
    // entering the designer before the defs are loaded keeps waiting
    expect(nextDesignerVisit(null, { module: 'designer', generation: null, survey: null })).toEqual({
      visit: null,
      leftUuids: null,
    })
    const entered = nextDesignerVisit(null, { module: 'designer', generation, survey })
    expect(entered.leftUuids).toBeNull()
    const visit = entered.visit as DesignerVisit
    expect(visit.snapshot).toContain(NodeDef.getUuid(getDefByName(survey, 'cluster_notes')))
    const edited = withNewDef(withNewDef(survey, 'new-saved'), 'new-temporary', true)
    // still in the designer: same visit
    expect(nextDesignerVisit(visit, { module: 'designer', generation, survey: edited })).toEqual({
      visit,
      leftUuids: null,
    })
    expect(nextDesignerVisit(visit, { module: 'home', generation, survey: edited })).toEqual({
      visit: null,
      leftUuids: ['new-saved'],
    })
  })

  test('designer visit: a new generation reports and snapshots again; another survey drops the visit', async () => {
    const survey = await buildAssistantSurvey()
    const visit = nextDesignerVisit(null, { module: 'designer', generation: generationOf(), survey }).visit
    const reloaded = withNewDef(survey, 'new-saved')
    const next = nextDesignerVisit(visit, { module: 'designer', generation: generationOf({ id: 2 }), survey: reloaded })
    expect(next.leftUuids).toEqual(['new-saved'])
    expect(next.visit?.generationId).toBe(2)
    expect(next.visit?.snapshot).toContain('new-saved')
    const otherSurvey = generationOf({ id: 3, surveyId: 8 })
    expect(nextDesignerVisit(next.visit, { module: 'home', generation: otherSurvey, survey: reloaded })).toEqual({
      visit: null,
      leftUuids: null,
    })
    // the defs are reloading: the visit waits
    expect(nextDesignerVisit(next.visit, { module: 'home', generation: null, survey: null }).visit).toBe(next.visit)
  })

  test('the defs load count grows with every load and survives a reset', () => {
    const loadedOnce = SurveyStatusState.assocDefsFetched({ draft: true, includeAnalysis: false, validate: false })({})
    const loadedTwice = SurveyStatusState.assocDefsFetched({ draft: true, includeAnalysis: false, validate: false })(
      SurveyStatusState.resetDefsFetched(loadedOnce)
    )
    expect(SurveyStatusState.getDefsLoadCount({ survey: { status: loadedOnce } })).toBe(1)
    expect(SurveyStatusState.resetDefsFetched(loadedOnce)).toEqual({ loadCount: 1 })
    expect(SurveyStatusState.getDefsLoadCount({ survey: { status: loadedTwice } })).toBe(2)
    expect(SurveyStatusState.isFetched({ survey: { status: SurveyStatusState.resetDefsFetched(loadedTwice) } })).toBe(
      false
    )
    expect(SurveyStatusState.getDefsLoadCount({ survey: {} })).toBe(0)
  })
})
