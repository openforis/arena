import {
  escalateConversationDataClass,
  getConversationDataClass,
  isDataToolResult,
} from '@webapp/ai/conversations/dataClass'
import { createConversation } from '@webapp/ai/conversations/conversationModel'
import { getTurnDataClass, resolveAssistantTurnModel } from '@webapp/ai/agent/turnModel'
import { createTurnState, isToolErrorOutput } from '@webapp/ai/agent/turnState'

import { getAiFeatureMinDataClass } from '@common/ai/features'

import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'

const schemaTool = { name: 'query_propose', dataClass: 'schema' } as any
const dataTool = { name: 'query_run', dataClass: 'data' } as any

describe('conversation data class', () => {
  test('defaults to schema, unknown values fail closed', () => {
    expect(getConversationDataClass(null)).toBe('schema')
    expect(getConversationDataClass({})).toBe('schema')
    expect(getConversationDataClass({ dataClass: 'data' })).toBe('data')
    expect(getConversationDataClass({ dataClass: 'nonsense' })).toBe('data')
  })

  test('escalates to data and never goes back', () => {
    const conversation = { id: 'c1', dataClass: 'schema' as const }
    const escalated = escalateConversationDataClass({ conversation, dataClass: 'data' })
    expect(escalated).toEqual({ id: 'c1', dataClass: 'data' })
    expect(conversation.dataClass).toBe('schema')
    expect(escalateConversationDataClass({ conversation: escalated, dataClass: 'schema' })).toBe(escalated)
    expect(escalateConversationDataClass({ conversation, dataClass: 'schema' })).toBe(conversation)
  })

  test('only successful data tool results escalate', () => {
    expect(isToolErrorOutput({ error: { code: 'queryTimeout', message: 'x' } })).toBe(true)
    expect(isToolErrorOutput({ error: { code: 'invalidProposal', message: 'Invalid', issues: [] } })).toBe(true)
    expect(isToolErrorOutput({ rows: [], total: 0 })).toBe(false)
    expect(isDataToolResult({ tool: dataTool, output: { rows: [], total: 0 } })).toBe(true)
    expect(isDataToolResult({ tool: dataTool, output: { error: { code: 'unknownQuery', message: 'x' } } })).toBe(false)
    expect(isDataToolResult({ tool: schemaTool, output: { queryId: 'q1' } })).toBe(false)
    expect(isDataToolResult({ tool: undefined, output: {} })).toBe(false)
  })

  test('the turn state saves the escalated class with the conversation', () => {
    const updates: any[] = []
    const conversation = createConversation({ userUuid: 'u', surveyId: 1, area: 'analysis' })
    const state = createTurnState({
      conversation,
      userMessage: 'How many plots?',
      onUpdate: (next) => updates.push(next),
    })
    state.escalateDataClass('schema')
    expect(state.get().dataClass).toBe('schema')
    const count = updates.length
    state.escalateDataClass('data')
    expect(state.get().dataClass).toBe('data')
    expect(updates).toHaveLength(count + 1)
    expect(updates.at(-1).dataClass).toBe('data')
  })
})

describe('turn data class and engine', () => {
  test('the turn class is the highest of the conversation and the tools', () => {
    expect(getTurnDataClass({ conversationDataClass: 'schema', tools: [schemaTool] })).toBe('schema')
    expect(getTurnDataClass({ conversationDataClass: 'schema', tools: [schemaTool, dataTool] })).toBe('data')
    expect(getTurnDataClass({ conversationDataClass: 'data', tools: [] })).toBe('data')
  })

  const newResolver = (hostingClassByDataClass: Record<string, string | null>) => {
    const calls: any[] = []
    const resolve = async (params: any) => {
      calls.push(params)
      const hostingClass = hostingClassByDataClass[params.dataClass]
      if (!hostingClass) {
        const error: any = new Error('no engine')
        error.key = 'aiNoEngineAvailable'
        throw error
      }
      return { model: { modelId: `m-${hostingClass}` }, engine: { id: hostingClass, hostingClass } as any }
    }
    return { resolve, calls }
  }
  const getToolsForHosting = (hostingClass: string) =>
    hostingClass === 'onDevice' ? [schemaTool, dataTool] : [schemaTool]
  const params = (dataClass: 'schema' | 'data') => ({ feature: 'assistantAnalysis' as const, surveyId: 1, dataClass })

  test('cloud engine, schema conversation: one resolution, schema declared', async () => {
    const { resolve, calls } = newResolver({ schema: 'cloud', data: null })
    const result = await resolveAssistantTurnModel({ params: params('schema'), getToolsForHosting, resolve })
    expect(calls).toEqual([{ feature: 'assistantAnalysis', surveyId: 1, dataClass: 'schema' }])
    expect(result.engine.hostingClass).toBe('cloud')
  })

  test('local engine, schema conversation: re-resolved with data, same engine', async () => {
    const { resolve, calls } = newResolver({ schema: 'onDevice', data: 'onDevice' })
    const result = await resolveAssistantTurnModel({ params: params('schema'), getToolsForHosting, resolve })
    expect(calls.map((call) => call.dataClass)).toEqual(['schema', 'data'])
    expect(result.engine.hostingClass).toBe('onDevice')
  })

  test('data conversation: selected with data', async () => {
    const { resolve, calls } = newResolver({ schema: 'cloud', data: 'onDevice' })
    const result = await resolveAssistantTurnModel({ params: params('data'), getToolsForHosting, resolve })
    expect(calls.map((call) => call.dataClass)).toEqual(['data'])
    expect(result.engine.hostingClass).toBe('onDevice')
  })

  test('data conversation without a data engine: no silent fallback to the cloud', async () => {
    const { resolve, calls } = newResolver({ schema: 'cloud', data: null })
    await expectSystemErrorKey(
      () => resolveAssistantTurnModel({ params: params('data'), getToolsForHosting, resolve }),
      'aiNoEngineAvailable'
    )
    expect(calls.map((call) => call.dataClass)).toEqual(['data'])
  })
})

describe('default data class', () => {
  test('fixed features keep their class, variable ones start at schema, unknown ones fail closed', () => {
    expect(getAiFeatureMinDataClass('assistantAnalysis')).toBe('schema')
    expect(getAiFeatureMinDataClass('notAFeature')).toBe('data')
  })
})
