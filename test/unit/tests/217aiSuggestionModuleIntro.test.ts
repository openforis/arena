import { assistantMarkers } from '@common/ai/prompts/assistantMarkers'
import { getScriptedStep } from '@server/modules/ai/service/mockScripts'
import { SUGGESTION_DEFINITIONS, type SuggestionDefinition } from '@webapp/ai/suggestions/definitions'
import { moduleIntroDefinition } from '@webapp/ai/suggestions/definitions/moduleIntro'
import { EVENT_DETECTORS, type DetectorContext } from '@webapp/ai/suggestions/detectors'
import { buildModuleIntroSuggestion, moduleIntroDetector } from '@webapp/ai/suggestions/detectors/moduleIntro'
import { buildModuleIntroPrompt } from '@webapp/ai/suggestions/prompts/moduleIntro'
import {
  acceptSuggestion,
  buildSuggestionRequest,
  dismissSuggestion,
  isRequestForScope,
  takeRequestForScope,
  type SuggestionDefinitions,
  type SuggestionRequestScope,
} from '@webapp/ai/suggestions/suggestionActions'
import { createSuggestionStore, type SuggestionStore } from '@webapp/ai/suggestions/suggestionStore'
import type { AssistantSuggestion, SuggestionRequest } from '@webapp/ai/suggestions/types'

const NOW = new Date('2026-10-11T12:00:00.000Z')
const LATER = new Date('2026-10-12T12:00:00.000Z')

const newStore = () =>
  createSuggestionStore({
    access: { getStorage: () => null, addStorageListener: () => () => undefined },
    now: () => NOW,
  })

const contextOf = (store: SuggestionStore, now = NOW): DetectorContext => ({
  userUuid: 'u1',
  generation: null,
  survey: null,
  availableAreas: ['help'],
  store,
  now: () => now,
})

const enter = (store: SuggestionStore, module: string, now = NOW) =>
  moduleIntroDetector.handle({ type: 'moduleEntered', module }, contextOf(store, now))

const helpPending = (store: SuggestionStore) => store.getPending({ userUuid: 'u1', surveyId: null })

const visibleIn = (store: SuggestionStore, surveyId: number | null, areas: SuggestionRequest['area'][]) =>
  store.getVisible({ userUuid: 'u1', surveyId, cycle: '0', availableAreas: areas, enabled: true })

const describeContext = { survey: null, t: (key: string) => key, lang: 'en' }

const scope: SuggestionRequestScope = { userUuid: 'u1', surveyId: 7, cycle: '0', area: 'help' }

const introRequest = (overrides: Partial<SuggestionRequest> = {}): SuggestionRequest => ({
  requestId: 'r1',
  userUuid: 'u1',
  surveyId: 7,
  cycle: '0',
  area: 'help',
  suggestionId: 'moduleIntro:designer',
  scope: { kind: 'moduleIntro', targetKeys: ['designer'] },
  prompt: buildModuleIntroPrompt('designer'),
  ...overrides,
})

// a Design kind that goes in progress on Do it (the default accept mode)
const designDefinition: SuggestionDefinition = {
  kind: 'missingTranslations',
  card: () => ({ key: 'x', params: {} }),
  prompt: (suggestion) => `Translate ${suggestion.targets.map((target) => target.key).join(', ')}`,
}
const definitions: SuggestionDefinitions = { ...SUGGESTION_DEFINITIONS, missingTranslations: designDefinition }

const designSuggestion: AssistantSuggestion = {
  id: 'missingTranslations:fr',
  kind: 'missingTranslations',
  area: 'design',
  surveyId: 7,
  cycle: null,
  targets: [{ key: 'a:labels' }, { key: 'b:labels' }],
  createdAt: NOW.toISOString(),
  expiresAt: null,
}

/**
 * Returns a send that records its calls and answers with the given id.
 * @param {string|null} id - Conversation id (null: nothing sent).
 * @returns {object} The send and its calls.
 */
const recordingSend = (id: string | null) => {
  const calls: unknown[][] = []
  const send = async (...args: unknown[]) => {
    calls.push(args)
    return id
  }
  return { calls, send }
}

const system = (text: string): any => ({ role: 'system', content: text })
const user = (text: string): any => ({ role: 'user', content: [{ type: 'text', text }] })
const toolCall = (id: string): any => ({
  role: 'assistant',
  content: [{ type: 'tool-call', toolCallId: id, toolName: 'docs_search', input: {} }],
})
const toolResult = (id: string): any => ({
  role: 'tool',
  content: [{ type: 'tool-result', toolCallId: id, toolName: 'docs_search', output: { type: 'json', value: {} } }],
})

describe('module introduction and suggestion actions (217)', () => {
  test('the first visit to the designer, Data or Analysis adds its introduction to Help; other modules add nothing', () => {
    const store = newStore()
    for (const module of ['designer', 'home', 'data', 'users', 'analysis']) enter(store, module)
    expect(helpPending(store)).toEqual(
      ['designer', 'data', 'analysis'].map((module) => buildModuleIntroSuggestion(module as any, NOW))
    )
    expect(buildModuleIntroSuggestion('data', NOW)).toEqual({
      id: 'moduleIntro:data',
      kind: 'moduleIntro',
      area: 'help',
      surveyId: null,
      cycle: null,
      targets: [{ key: 'data' }],
      createdAt: NOW.toISOString(),
      expiresAt: null,
    })
  })

  test('a seen module is never offered; a second visit keeps the pending introduction as it is', () => {
    const store = newStore()
    store.markModuleSeen({ userUuid: 'u1', module: 'designer' })
    enter(store, 'designer')
    expect(helpPending(store)).toEqual([])
    enter(store, 'data')
    enter(store, 'data', LATER)
    expect(helpPending(store)).toEqual([buildModuleIntroSuggestion('data', NOW)])
  })

  test('registered: the detector listens to moduleEntered in Help, the definition removes the card on Do it', () => {
    expect(EVENT_DETECTORS).toContain(moduleIntroDetector)
    expect(moduleIntroDetector).toMatchObject({
      kind: 'moduleIntro',
      area: 'help',
      needsDraft: false,
      on: ['moduleEntered'],
    })
    expect(SUGGESTION_DEFINITIONS.moduleIntro).toBe(moduleIntroDefinition)
    expect(moduleIntroDefinition.acceptMode).toBe('remove')
  })

  test('card key and English prompt of each module (spec texts); an unknown module has no card', () => {
    const intro = (module: string) => ({ ...buildModuleIntroSuggestion('designer', NOW), targets: [{ key: module }] })
    expect(moduleIntroDefinition.card(intro('designer'), describeContext)).toEqual({
      key: 'moduleIntro.card.designer',
      params: {},
    })
    expect(moduleIntroDefinition.prompt(intro('designer'), describeContext)).toBe(
      "I'm new to the form designer. Explain what it is for and the main steps to get started, using the Arena manual."
    )
    expect(moduleIntroDefinition.prompt(intro('data'), describeContext)).toBe(
      "I'm new to the Data module. Explain what it is for and the main steps to get started, using the Arena manual."
    )
    expect(moduleIntroDefinition.prompt(intro('analysis'), describeContext)).toBe(
      "I'm new to the Analysis module. Explain what it is for and the main steps to get started, using the Arena manual."
    )
    expect(() => moduleIntroDefinition.card(intro('users'), describeContext)).toThrow()
  })

  test('Do it builds a request from the visible targets; no request without a definition or when the prompt fails', () => {
    const visible = { ...designSuggestion, targets: [{ key: 'b:labels' }] }
    const params = { userUuid: 'u1', surveyId: 7, cycle: '0', describeContext, definitions, newId: () => 'r9' }
    expect(buildSuggestionRequest({ ...params, suggestion: visible })).toEqual({
      requestId: 'r9',
      userUuid: 'u1',
      surveyId: 7,
      cycle: '0',
      area: 'design',
      suggestionId: 'missingTranslations:fr',
      scope: { kind: 'missingTranslations', targetKeys: ['b:labels'] },
      prompt: 'Translate b:labels',
    })
    expect(buildSuggestionRequest({ ...params, suggestion: visible, definitions: {} })).toBeNull()
    const failing = {
      ...designDefinition,
      prompt: () => {
        throw new Error('bad target')
      },
    }
    expect(
      buildSuggestionRequest({ ...params, suggestion: visible, definitions: { missingTranslations: failing } })
    ).toBeNull()
  })

  test('the claim drops a request of another user, survey, cycle or area: claimed, so it is never sent', () => {
    const claimed: string[] = []
    let pending: SuggestionRequest | null = introRequest()
    const claim = (requestId: string) => {
      claimed.push(requestId)
      const request = pending?.requestId === requestId ? pending : null
      pending = null
      return request
    }
    expect(isRequestForScope(introRequest(), scope)).toBe(true)
    for (const other of [{ userUuid: 'u2' }, { surveyId: 8 }, { cycle: '1' }, { area: 'design' as const }]) {
      expect(isRequestForScope(introRequest(), { ...scope, ...other })).toBe(false)
    }
    expect(takeRequestForScope({ pending, scope: { ...scope, surveyId: 8 }, claim })).toBeNull()
    expect(pending).toBeNull()
    expect(takeRequestForScope({ pending: null, scope, claim })).toBeNull()
    expect(claimed).toEqual(['r1'])
    pending = introRequest({ requestId: 'r2' })
    expect(takeRequestForScope({ pending, scope, claim })).toEqual(introRequest({ requestId: 'r2' }))
    // claimed already (another chat or a second effect run): nothing to send
    expect(takeRequestForScope({ pending: introRequest({ requestId: 'r2' }), scope, claim })).toBeNull()
  })

  test('accepting a Design suggestion sends it scoped, then puts its targets in progress for the new conversation', async () => {
    const store = newStore()
    store.add({ userUuid: 'u1', suggestion: designSuggestion })
    const { calls, send } = recordingSend('c1')
    const request = introRequest({
      area: 'design',
      suggestionId: designSuggestion.id,
      scope: { kind: 'missingTranslations', targetKeys: ['a:labels', 'b:labels'] },
      prompt: 'Translate a:labels, b:labels',
    })
    expect(await acceptSuggestion({ request, send, store, definitions })).toBe('c1')
    expect(calls).toEqual([
      ['Translate a:labels, b:labels', { suggestion: { id: designSuggestion.id, scope: request.scope } }],
    ])
    expect(store.getInProgressConversationIds('u1')).toEqual(['c1'])
    expect(visibleIn(store, 7, ['design'])).toEqual([])
  })

  test('when send creates no turn (busy, applying, not ready) nothing is marked and the card stays', async () => {
    const store = newStore()
    store.add({ userUuid: 'u1', suggestion: designSuggestion })
    enter(store, 'designer')
    const { send } = recordingSend(null)
    const request = introRequest({ area: 'design', suggestionId: designSuggestion.id })
    expect(
      await acceptSuggestion({
        request: { ...request, scope: { ...request.scope, kind: 'missingTranslations' } },
        send,
        store,
        definitions,
      })
    ).toBeNull()
    expect(await acceptSuggestion({ request: introRequest(), send, store, definitions })).toBeNull()
    expect(store.getInProgressConversationIds('u1')).toEqual([])
    expect(visibleIn(store, 7, ['design', 'help'])).toHaveLength(2)
    expect(store.isModuleSeen({ userUuid: 'u1', module: 'designer' })).toBe(false)
  })

  test('accepting the introduction removes it from Help (any open survey) and marks the module seen', async () => {
    const store = newStore()
    enter(store, 'designer')
    const { send } = recordingSend('c2')
    expect(await acceptSuggestion({ request: introRequest(), send, store })).toBe('c2')
    expect(helpPending(store)).toEqual([])
    expect(store.getInProgressConversationIds('u1')).toEqual([])
    expect(store.isModuleSeen({ userUuid: 'u1', module: 'designer' })).toBe(true)
    enter(store, 'designer')
    expect(helpPending(store)).toEqual([])
  })

  test('dismissing hides the visible targets; the introduction also marks its module seen for good', () => {
    const store = newStore()
    store.add({ userUuid: 'u1', suggestion: designSuggestion })
    enter(store, 'analysis')
    dismissSuggestion({ suggestion: designSuggestion, userUuid: 'u1', store, definitions })
    expect(visibleIn(store, 7, ['design'])).toEqual([])
    expect(store.isModuleSeen({ userUuid: 'u1', module: 'analysis' })).toBe(false)
    dismissSuggestion({ suggestion: buildModuleIntroSuggestion('analysis', NOW), userUuid: 'u1', store })
    expect(visibleIn(store, null, ['help'])).toEqual([])
    expect(store.isModuleSeen({ userUuid: 'u1', module: 'analysis' })).toBe(true)
    enter(store, 'analysis')
    expect(visibleIn(store, null, ['help'])).toEqual([])
  })

  test('the mock provider answers the introduction prompt from the manual (e2e script)', () => {
    const start = [
      system(`${assistantMarkers.help}\nYou are the help assistant.`),
      user(buildModuleIntroPrompt('designer')),
    ]
    expect(getScriptedStep(start)).toEqual({
      toolCall: { toolName: 'docs_search', input: { query: 'getting started' } },
    })
    expect(getScriptedStep([...start, toolCall('a'), toolResult('a')])).toEqual({
      text: 'MOCK help: start with the steps of the cited manual section.',
    })
  })
})
