import { getEngineChangeNotice, resolveAssistantEngine } from '@webapp/ai/engines/assistantEngine'
import type { AiSelectedEngine } from '@webapp/ai/engines/types'

const DEFAULT_LIMITS = { maxPromptChars: 200000, maxSteps: 10 }

const localEngine: AiSelectedEngine = {
  id: 'localServer',
  hostingClass: 'onDevice',
  label: 'LM Studio',
  model: 'local-model',
  limits: { maxPromptChars: 18432, maxSteps: 6 },
}

const gatewayEngine: AiSelectedEngine = {
  id: 'gateway',
  hostingClass: 'cloud',
  label: 'openai',
  model: 'gateway-model',
  limits: DEFAULT_LIMITS,
}

const createResolve = (engine: AiSelectedEngine) => {
  const calls: unknown[] = []
  const resolve = async (params: unknown) => {
    calls.push(params)
    return { model: `model of ${engine.id}`, engine }
  }
  return { calls, resolve }
}

const access = { effective: { schema: 'cloud', data: 'onDevice' }, hostingClass: 'cloud' as const }

describe('resolveAssistantEngine', () => {
  test("the engine's model, step cap, budget and hosting class", async () => {
    const { calls, resolve } = createResolve(localEngine)
    const result = await resolveAssistantEngine({
      defaultLimits: DEFAULT_LIMITS,
      access,
      feature: 'assistantDesign',
      surveyId: 7,
      dataClass: 'schema',
      resolve,
    })
    expect(calls).toEqual([{ feature: 'assistantDesign', surveyId: 7, dataClass: 'schema' }])
    expect(result.model).toBe('model of localServer')
    expect(result.limits).toEqual({ maxPromptChars: 18432, maxSteps: 6 })
    expect(result.access).toEqual({ effective: access.effective, hostingClass: 'onDevice' })
    expect(result.engine).toBe(localEngine)
  })

  test("the conversation's data class is passed through", async () => {
    const { calls, resolve } = createResolve(gatewayEngine)
    await resolveAssistantEngine({
      defaultLimits: DEFAULT_LIMITS,
      access,
      feature: 'chatbot',
      dataClass: 'data',
      resolve,
    })
    expect(calls).toEqual([{ feature: 'chatbot', surveyId: undefined, dataClass: 'data' }])
  })

  test("a caller's model is used as is, without resolving", async () => {
    const { calls, resolve } = createResolve(localEngine)
    const result = await resolveAssistantEngine({
      model: 'test model',
      defaultLimits: DEFAULT_LIMITS,
      access,
      feature: 'assistantDesign',
      dataClass: 'schema',
      resolve,
    })
    expect(calls).toEqual([])
    expect(result).toEqual({ model: 'test model', limits: DEFAULT_LIMITS, access, engine: null })
  })

  test("a caller's limits win over the engine's", async () => {
    const { resolve } = createResolve(localEngine)
    const limits = { maxPromptChars: 500, maxSteps: 2 }
    const result = await resolveAssistantEngine({
      limits,
      defaultLimits: DEFAULT_LIMITS,
      access,
      feature: 'assistantDesign',
      dataClass: 'schema',
      resolve,
    })
    expect(result.limits).toBe(limits)
  })

  test('resolve errors (aiNoEngineAvailable, consent cancelled) reach the caller', async () => {
    const error = new Error('aiNoEngineAvailable')
    const resolve = async () => {
      throw error
    }
    await expect(
      resolveAssistantEngine({
        defaultLimits: DEFAULT_LIMITS,
        access,
        feature: 'chatbot',
        dataClass: 'schema',
        resolve,
      })
    ).rejects.toBe(error)
  })
})

describe('getEngineChangeNotice', () => {
  test('nothing on the first turn, nor when the engine is the same', () => {
    expect(getEngineChangeNotice({ previous: null, engine: localEngine })).toBeNull()
    const previous = { hostingClass: 'onDevice' as const, provider: null, model: 'local-model', engine: 'LM Studio' }
    expect(getEngineChangeNotice({ previous, engine: localEngine })).toBeNull()
  })

  test('the new location when the engine changed (local server stopped)', () => {
    const previous = { hostingClass: 'onDevice' as const, provider: null, model: 'local-model', engine: 'LM Studio' }
    expect(getEngineChangeNotice({ previous, engine: gatewayEngine })).toEqual({
      hostingClass: 'cloud',
      provider: 'openai',
      model: 'gateway-model',
      engine: null,
    })
  })
})
