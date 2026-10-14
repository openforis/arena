import { generateText, streamText } from 'ai'

import { createGatewayEngine } from '@webapp/ai/engines/gatewayEngine'
import { getGatewayEngineInfo, getLocalServerEngineInfo } from '@webapp/ai/engines/engineInfo'
import { createLocalServerEngine } from '@webapp/ai/engines/localServerEngine'
import type { AiGatewayCapability, AiLocalServerCapability, AiSelectedEngine } from '@webapp/ai/engines/types'
import { getAiErrorKey } from '@webapp/ai/runtime/runtimeErrors'

const localServer = (overrides: Partial<AiLocalServerCapability> = {}): AiLocalServerCapability => ({
  enabled: true,
  reachable: true,
  models: ['local-model'],
  hostingClass: 'onDevice',
  contextTokens: 4096,
  baseUrl: 'http://localhost:1234/v1',
  modelId: 'local-model',
  error: null,
  ...overrides,
})

const gateway = (overrides: Partial<AiGatewayCapability> = {}): AiGatewayCapability => ({
  available: true,
  hostingClass: 'cloud',
  provider: 'openai',
  model: 'gateway-model',
  maxPromptChars: 100000,
  ...overrides,
})

const completion = (content: string) =>
  new Response(
    JSON.stringify({
      id: 'c1',
      object: 'chat.completion',
      created: 0,
      model: 'local-model',
      choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )

const chunk = (delta: object, finishReason: string | null) =>
  `data: ${JSON.stringify({ id: 'c1', object: 'chat.completion.chunk', created: 0, model: 'local-model', choices: [{ index: 0, delta, finish_reason: finishReason }] })}\n\n`

const sse = (texts: string[]) =>
  new Response([...texts.map((content) => chunk({ content }, null)), chunk({}, 'stop'), 'data: [DONE]\n\n'].join(''), {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  })

const recorder = (respond: () => Promise<Response>) => {
  const calls: { url: string; init?: RequestInit }[] = []
  const fetchImpl = async (url: string, init?: RequestInit) => {
    calls.push({ url, init })
    return respond()
  }
  return { calls, fetchImpl }
}

const modelOptions = { feature: 'expressionExplain', dataClass: 'schema' } as const

describe('engine info', () => {
  test('local server on this device: Local server label, limits from the context', () => {
    expect(getLocalServerEngineInfo(localServer())).toEqual({
      id: 'localServer',
      hostingClass: 'onDevice',
      label: 'Local server',
      model: 'local-model',
      limits: { maxPromptChars: 9216, maxSteps: 6 },
      contextWindow: { tokens: 4096, assumed: false },
    })
  })

  test('organisation server: the host as label, 8,192 tokens when the context is unknown', () => {
    const info = getLocalServerEngineInfo(
      localServer({ hostingClass: 'orgHosted', baseUrl: 'http://10.0.0.5:8000/v1', contextTokens: null })
    )
    expect(info?.label).toBe('10.0.0.5:8000')
    expect(info?.limits).toEqual({ maxPromptChars: 18432, maxSteps: 6 })
  })

  test('no URL or class: no engine', () => {
    expect(getLocalServerEngineInfo(localServer({ baseUrl: null }))).toBeNull()
    expect(getLocalServerEngineInfo(localServer({ hostingClass: null }))).toBeNull()
  })

  test("a local provider's name as label", () => {
    expect(getLocalServerEngineInfo(localServer(), 'Desk server')?.label).toBe('Desk server')
  })

  test('gateway: provider label, 10 steps, the instance prompt cap', () => {
    expect(getGatewayEngineInfo(gateway())).toEqual({
      id: 'gateway',
      hostingClass: 'cloud',
      label: 'openai',
      model: 'gateway-model',
      limits: { maxPromptChars: 100000, maxSteps: 10 },
    })
    expect(getGatewayEngineInfo(gateway({ maxPromptChars: null }))?.limits.maxPromptChars).toBe(200000)
    expect(getGatewayEngineInfo(gateway({ hostingClass: null }))).toBeNull()
  })
})

describe('createLocalServerEngine', () => {
  test('generates through POST {baseUrl}/chat/completions with the chosen model', async () => {
    const { calls, fetchImpl } = recorder(async () => completion('MOCK answer.'))
    const engine = createLocalServerEngine({ localServer: localServer(), fetchImpl })
    const result = await generateText({ model: engine.createModel(modelOptions), prompt: 'hi', maxRetries: 0 })
    expect(result.text).toBe('MOCK answer.')
    expect(calls[0].url).toBe('http://localhost:1234/v1/chat/completions')
    expect(JSON.parse(String(calls[0].init?.body)).model).toBe('local-model')
    expect((calls[0].init as any).targetAddressSpace).toBeUndefined()
    expect(engine.limits).toEqual({ maxPromptChars: 9216, maxSteps: 6 })
  })

  test('streams, and asks for local network access on a LAN server', async () => {
    const { calls, fetchImpl } = recorder(async () => sse(['MOCK ', 'answer.']))
    const engine = createLocalServerEngine({
      localServer: localServer({ hostingClass: 'orgHosted', baseUrl: 'http://192.168.1.20:1234/v1' }),
      fetchImpl,
    })
    const result = streamText({ model: engine.createModel(modelOptions), prompt: 'hi', maxRetries: 0 })
    let text = ''
    for await (const delta of result.textStream) text += delta
    expect(text).toBe('MOCK answer.')
    expect((calls[0].init as any).targetAddressSpace).toBe('local')
  })

  test('inline <think> tags become reasoning, not text', async () => {
    const { fetchImpl } = recorder(async () => sse(['<think>They greet', ' me.</think>', 'Hello!']))
    const engine = createLocalServerEngine({ localServer: localServer(), fetchImpl })
    const result = streamText({ model: engine.createModel(modelOptions), prompt: 'hi', maxRetries: 0 })
    let text = ''
    let reasoning = ''
    for await (const part of result.fullStream) {
      if (part.type === 'text-delta') text += part.text
      if (part.type === 'reasoning-delta') reasoning += part.text
    }
    expect(text).toBe('Hello!')
    expect(reasoning).toBe('They greet me.')
  })

  test('errors keep their specific key through the AI SDK', async () => {
    const missing = recorder(async () => new Response('{"error":{"message":"Model not found"}}', { status: 404 }))
    const engine = createLocalServerEngine({ localServer: localServer(), fetchImpl: missing.fetchImpl })
    const error = await generateText({ model: engine.createModel(modelOptions), prompt: 'hi' }).catch((e) => e)
    expect(getAiErrorKey(error)).toBe('aiLocalServerModelMissing')

    const down = recorder(async () => {
      throw new TypeError('Failed to fetch')
    })
    const downEngine = createLocalServerEngine({ localServer: localServer(), fetchImpl: down.fetchImpl })
    const downError = await generateText({ model: downEngine.createModel(modelOptions), prompt: 'hi' }).catch((e) => e)
    expect(getAiErrorKey(downError)).toBe('aiLocalServerUnreachable')
  })

  test('refuses a server without a chosen model', () => {
    const { fetchImpl } = recorder(async () => completion('x'))
    expect(() => createLocalServerEngine({ localServer: localServer({ modelId: null }), fetchImpl })).toThrow(
      'aiNoEngineAvailable'
    )
  })
})

describe('createGatewayEngine', () => {
  const engine = { ...getGatewayEngineInfo(gateway()), providerId: 'acct:a1' } as AiSelectedEngine

  test('passes the request options and the provider to the gateway model factory', () => {
    const received: unknown[] = []
    const fakeModel = { modelId: 'gateway' } as any
    const gatewayEngine = createGatewayEngine({
      engine,
      createGatewayModel: (options) => {
        received.push(options)
        return fakeModel
      },
    })
    expect(gatewayEngine.createModel({ feature: 'activityLogSummary', dataClass: 'data', surveyId: 7 })).toBe(fakeModel)
    expect(received).toEqual([{ feature: 'activityLogSummary', dataClass: 'data', surveyId: 7, providerId: 'acct:a1' }])
    expect(gatewayEngine.id).toBe('gateway')
  })

  test('refuses an engine without a provider', () => {
    expect(() =>
      createGatewayEngine({ engine: { ...engine, providerId: undefined }, createGatewayModel: () => ({}) as any })
    ).toThrow('aiNoEngineAvailable')
  })
})
