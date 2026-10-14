import { resolveAssistantTurnModel } from '@webapp/ai/agent/turnModel'
import { createConversation, withConversationProvider } from '@webapp/ai/conversations/conversationModel'
import { createMemoryConversationStore } from '@webapp/ai/conversations/conversationStore'
import { resolveAssistantEngine } from '@webapp/ai/engines/assistantEngine'
import type { AiSelectedEngine } from '@webapp/ai/engines/types'

const engine: AiSelectedEngine = {
  id: 'gateway',
  hostingClass: 'cloud',
  label: 'My OpenAI',
  model: 'gpt-x',
  limits: { maxPromptChars: 200000, maxSteps: 10 },
  providerId: 'acct:a1',
}

/** Builds a resolve function that records its calls. */
const createResolve = () => {
  const calls: any[] = []
  /** Records the call and returns the engine's model. */
  const resolve = async (params: unknown) => {
    calls.push(params)
    return { model: 'model', engine }
  }
  return { calls, resolve }
}

describe('conversation provider (272)', () => {
  test('the chosen provider is stored with the conversation; a new one has none', async () => {
    const store = createMemoryConversationStore({ keep: 10 })
    const created = createConversation({ userUuid: 'u1', surveyId: 1, area: 'analysis', idFactory: () => 'c1' })
    expect('providerId' in created).toBe(false)
    await store.save(withConversationProvider({ conversation: created, providerId: 'local:l1' }))
    expect((await store.get('c1'))?.providerId).toBe('local:l1')
  })

  test("the turn resolves the conversation's provider", async () => {
    const { calls, resolve } = createResolve()
    await resolveAssistantEngine({
      defaultLimits: { maxPromptChars: 1000, maxSteps: 2 },
      access: { hostingClass: null },
      feature: 'assistantAnalysis',
      surveyId: 1,
      dataClass: 'data',
      providerId: 'acct:a1',
      resolve,
    })
    expect(calls).toEqual([{ feature: 'assistantAnalysis', surveyId: 1, dataClass: 'data', providerId: 'acct:a1' }])
  })

  test('a turn that offers data tools asks again with the same provider', async () => {
    const { calls, resolve } = createResolve()
    await resolveAssistantTurnModel({
      params: { feature: 'assistantAnalysis', surveyId: 1, dataClass: 'schema', providerId: 'local:l1' },
      getToolsForHosting: () => [{ dataClass: 'data' }],
      resolve,
    })
    expect(calls.map((call) => [call.dataClass, call.providerId])).toEqual([
      ['schema', 'local:l1'],
      ['data', 'local:l1'],
    ])
  })
})
