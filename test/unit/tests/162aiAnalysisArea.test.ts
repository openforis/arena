import {
  getAnalysisAreaStatus,
  getProposedQueryId,
  isAnalysisRoute,
  shouldShowRecordDataNotice,
} from '@webapp/components/ai/Assistant/analysis/analysisArea'

import { getAiEngineFeatureAvailability } from '@webapp/ai/engines/featureAvailability'
import { pickArea } from '@webapp/components/ai/Assistant/assistantAreas'
import { createTurnState } from '@webapp/ai/agent/turnState'
import { createConversation } from '@webapp/ai/conversations/conversationModel'
import { createAnalysisQueryStore } from '@webapp/ai/tools/analysis/queryStore'

const available = { status: 'available' } as any
const noEngine = { status: 'noEngine', reasonKeys: ['aiEngine.unavailable.notAvailable'] } as any

describe('analysis routes', () => {
  test('explorer and dashboard', () => {
    expect(isAnalysisRoute('/app/data/explorer/')).toBe(true)
    expect(isAnalysisRoute('/app/data/explorer')).toBe(true)
    expect(isAnalysisRoute('/app/dashboard/')).toBe(true)
    expect(isAnalysisRoute('/app/data/records/')).toBe(false)
    expect(isAnalysisRoute('/app/designer/formDesigner/')).toBe(false)
  })
})

describe('area status', () => {
  test('hidden without survey, without explorer access or when disabled', () => {
    const hidden = { area: 'analysis', status: 'hidden', reasonKeys: [] }
    expect(getAnalysisAreaStatus({ surveyOpen: false, canUseExplorer: true, availability: available })).toEqual(hidden)
    expect(getAnalysisAreaStatus({ surveyOpen: true, canUseExplorer: false, availability: available })).toEqual(hidden)
    expect(
      getAnalysisAreaStatus({ surveyOpen: true, canUseExplorer: true, availability: { status: 'disabled' } as any })
    ).toEqual(hidden)
  })

  test('otherwise follows the schema availability', () => {
    expect(getAnalysisAreaStatus({ surveyOpen: true, canUseExplorer: true, availability: available })).toEqual({
      area: 'analysis',
      status: 'available',
      reasonKeys: [],
    })
    expect(getAnalysisAreaStatus({ surveyOpen: true, canUseExplorer: true, availability: noEngine })).toEqual({
      area: 'analysis',
      status: 'unavailable',
      reasonKeys: ['aiEngine.unavailable.notAvailable'],
    })
    expect(
      getAnalysisAreaStatus({
        surveyOpen: true,
        canUseExplorer: true,
        availability: { status: 'policyBlocked' } as any,
      })
    ).toEqual({ area: 'analysis', status: 'unavailable', reasonKeys: ['aiAssistant.unavailable.policy'] })
  })

  test('pickArea prefers analysis on analysis routes only where the preferred area applies', () => {
    const statuses: any[] = ['design', 'analysis', 'help'].map((area) => ({
      area,
      status: 'available',
      reasonKeys: [],
    }))
    const base = { statuses, module: 'data', analysisRoute: true }
    // (a) panel closed
    expect(pickArea({ ...base, current: null, panelOpen: false, userSelectedArea: null })).toBe('analysis')
    // (b) panel open on an available area: kept
    expect(pickArea({ ...base, current: 'design', panelOpen: true, userSelectedArea: null })).toBe('design')
    // (c) the user's tab is kept
    expect(pickArea({ ...base, current: 'help', panelOpen: true, userSelectedArea: 'help' })).toBe('help')
    // not an analysis route, or analysis unavailable
    expect(pickArea({ ...base, analysisRoute: false, current: null, panelOpen: false, userSelectedArea: null })).toBe(
      'help'
    )
    const unavailable = statuses.map((item) => (item.area === 'analysis' ? { ...item, status: 'unavailable' } : item))
    expect(pickArea({ ...base, statuses: unavailable, current: null, panelOpen: false, userSelectedArea: null })).toBe(
      'help'
    )
  })
})

describe('record data notice (review focus 3)', () => {
  test('shown for a data conversation when the policy blocks the conversation provider', () => {
    expect(
      shouldShowRecordDataNotice({
        conversationDataClass: 'data',
        dataAvailability: { status: 'policyBlocked' } as any,
      })
    ).toBe(true)
  })

  test('not shown when the provider is merely unreachable: the error card and the switcher handle it', () => {
    expect(shouldShowRecordDataNotice({ conversationDataClass: 'data', dataAvailability: noEngine })).toBe(false)
  })

  test('follows the conversation provider: an on-device one gets no notice although the default is cloud', () => {
    const entry = (id: string, hostingClass: 'cloud' | 'onDevice', kind: 'account' | 'local') => ({
      id,
      kind,
      type: kind === 'local' ? 'local' : 'openai',
      name: id,
      model: 'm',
      baseUrl: null,
      hostingClass,
      status: 'ready',
    })
    const capabilities: any = {
      instance: { policyCeilings: null, orgHostedBaseUrls: [], maxPromptChars: 1000 },
      providers: [entry('acct:a1', 'cloud', 'account'), entry('local:l1', 'onDevice', 'local')],
      defaultProviderId: 'acct:a1',
      local: {
        'local:l1': {
          enabled: true,
          reachable: true,
          models: ['m'],
          hostingClass: 'onDevice',
          contextTokens: 8192,
          baseUrl: 'http://localhost:1234/v1',
          modelId: 'm',
          error: null,
        },
      },
    }
    const getNotice = (providerId?: string) =>
      shouldShowRecordDataNotice({
        conversationDataClass: 'data',
        dataAvailability: getAiEngineFeatureAvailability({
          enabled: true,
          effective: { schema: 'cloud', data: 'onDevice' },
          dataClass: 'data',
          surveyScoped: true,
          capabilities,
          providerId,
        }),
      })
    expect(getNotice()).toBe(true)
    expect(getNotice('local:l1')).toBe(false)
  })

  test('not shown while the availability is not known yet (disabled)', () => {
    expect(
      shouldShowRecordDataNotice({ conversationDataClass: 'data', dataAvailability: { status: 'disabled' } as any })
    ).toBe(false)
  })

  test('not shown while a data engine is available, nor for schema conversations', () => {
    expect(shouldShowRecordDataNotice({ conversationDataClass: 'data', dataAvailability: available })).toBe(false)
    expect(shouldShowRecordDataNotice({ conversationDataClass: 'schema', dataAvailability: noEngine })).toBe(false)
  })
})

describe('proposed query id', () => {
  test('only for successful query_propose results', () => {
    expect(getProposedQueryId({ toolName: 'query_propose', output: { queryId: 'q2', shownToUser: true } })).toBe('q2')
    expect(
      getProposedQueryId({
        toolName: 'query_propose',
        output: { error: { code: 'invalidProposal', message: 'Invalid', issues: [] } },
      })
    ).toBeNull()
    expect(getProposedQueryId({ toolName: 'query_run', output: { queryId: 'q2' } })).toBeNull()
    expect(getProposedQueryId({ toolName: 'query_propose', output: null })).toBeNull()
  })
})

describe('queries of a turn', () => {
  test('a query proposed during a turn is saved with the conversation', () => {
    const updates: any[] = []
    const conversation = createConversation({ userUuid: 'u', surveyId: 1, area: 'analysis' })
    const state = createTurnState({
      conversation,
      userMessage: 'Trees per plot',
      onUpdate: (next) => updates.push(next),
    })
    const store = createAnalysisQueryStore({
      queries: conversation.queries ?? {},
      onChange: state.setQueries,
      now: () => 'T',
    })
    store.add({ query: { entityDefUuid: 'e1' }, explanation: 'E', entityName: 'tree', mode: 'raw' })
    expect(Object.keys(state.get().queries ?? {})).toEqual(['q1'])
    expect(Object.keys(updates.at(-1).queries)).toEqual(['q1'])
    // later turn state updates keep the queries
    state.appendText('Done.')
    expect(Object.keys(state.get().queries ?? {})).toEqual(['q1'])
  })
})

describe('analysis status keeps the engine availability (F5)', () => {
  test('an unavailable engine status carries engineAvailability for the panel actions', () => {
    const availability = {
      status: 'noEngine',
      reasonKeys: ['aiEngine.unavailable.notAvailable'],
      reasons: [],
    } as any
    const status = getAnalysisAreaStatus({ surveyOpen: true, canUseExplorer: true, availability })
    expect(status.engineAvailability).toBe(availability)
  })
})

describe('query ids continue in a reloaded conversation', () => {
  test('q3 after q2', () => {
    const entry = { query: {}, explanation: 'E', entityName: 'tree', mode: 'raw', createdAt: 'T' }
    const store = createAnalysisQueryStore({ queries: { q1: { ...entry, id: 'q1' }, q2: { ...entry, id: 'q2' } } })
    expect(store.add({ query: {}, explanation: 'E', entityName: 'tree', mode: 'raw' }).id).toBe('q3')
  })
})
