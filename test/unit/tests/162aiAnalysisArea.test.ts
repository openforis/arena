import {
  getAnalysisAreaStatus,
  getProposedQueryId,
  isAnalysisRoute,
  shouldSelectAnalysisArea,
  shouldShowRecordDataNotice,
} from '@webapp/components/ai/Assistant/analysis/analysisArea'

import { createTurnState } from '@webapp/ai/agent/turnState'
import { createConversation } from '@webapp/ai/conversations/conversationModel'
import { createAnalysisQueryStore } from '@webapp/ai/tools/analysis/queryStore'

const available = { status: 'available' } as any
const noEngine = { status: 'noEngine', reasonKeys: ['aiEngine.unavailable.localServerNotEnabled'] } as any

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
      reasonKeys: ['aiEngine.unavailable.localServerNotEnabled'],
    })
    expect(
      getAnalysisAreaStatus({
        surveyOpen: true,
        canUseExplorer: true,
        availability: { status: 'policyBlocked' } as any,
      })
    ).toEqual({ area: 'analysis', status: 'unavailable', reasonKeys: ['aiAssistant.unavailable.policy'] })
  })

  test('selected automatically on analysis routes only when available and not overridden', () => {
    const pathname = '/app/data/explorer/'
    expect(shouldSelectAnalysisArea({ pathname, status: 'available', userSelectedArea: null })).toBe(true)
    expect(shouldSelectAnalysisArea({ pathname, status: 'unavailable', userSelectedArea: null })).toBe(false)
    expect(shouldSelectAnalysisArea({ pathname, status: 'available', userSelectedArea: 'design' })).toBe(false)
    expect(
      shouldSelectAnalysisArea({ pathname: '/app/data/records/', status: 'available', userSelectedArea: null })
    ).toBe(false)
  })
})

describe('record data notice (review focus 3)', () => {
  test('shown for a data conversation when no engine allows data any more', () => {
    expect(shouldShowRecordDataNotice({ conversationDataClass: 'data', dataAvailability: noEngine })).toBe(true)
    expect(
      shouldShowRecordDataNotice({
        conversationDataClass: 'data',
        dataAvailability: { status: 'policyBlocked' } as any,
      })
    ).toBe(true)
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
      reasonKeys: ['aiEngine.unavailable.localServerNotEnabled'],
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
