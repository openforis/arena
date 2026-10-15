import { generateText, streamText } from 'ai'

import { createGatewayEngine } from '@webapp/ai/engines/gatewayEngine'
import { getGatewayEngineInfo, getLocalServerEngineInfo } from '@webapp/ai/engines/engineInfo'
import { createLocalServerEngine } from '@webapp/ai/engines/localServerEngine'
import type { AiLocalServerCapability, AiProviderEntry, AiSelectedEngine } from '@webapp/ai/engines/types'
import { getAiErrorKey } from '@webapp/ai/runtime/runtimeErrors'

const localServer = (overrides: Partial<AiLocalServerCapability> = {}): AiLocalServerCapability => ({
  reachable: true,
  models: ['local-model'],
  hostingClass: 'onDevice',
  contextTokens: 4096,
  baseUrl: 'http://localhost:1234/v1',
  modelId: 'local-model',
  error: null,
  ...overrides,
})

const localEntry = (overrides: Partial<AiProviderEntry> = {}): AiProviderEntry => ({
  id: 'local:l1',
  kind: 'local',
  type: 'local',
  name: 'Local server',
  model: 'local-model',
  baseUrl: 'http://localhost:1234/v1',
  hostingClass: 'onDevice',
  status: 'ready',
  ...overrides,
})

const gatewayEntry = (overrides: Partial<AiProviderEntry> = {}): AiProviderEntry => ({
  id: 'acct:a1',
  kind: 'account',
  type: 'openai',
  name: 'My OpenAI',
  model: 'gateway-model',
  baseUrl: null,
  hostingClass: 'cloud',
  status: 'ready',
  ...overrides,
})

const localInfo = (capability: AiLocalServerCapability = localServer(), entry: AiProviderEntry = localEntry()) =>
  getLocalServerEngineInfo({ entry, capability })

const gatewayInfo = (entry: AiProviderEntry = gatewayEntry(), maxPromptChars: number | null = 100000) =>
  getGatewayEngineInfo({ entry, maxPromptChars })

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
  test('local server: the provider name as label, its id, limits from the context', () => {
    expect(localInfo()).toEqual({
      id: 'localServer',
      hostingClass: 'onDevice',
      label: 'Local server',
      model: 'local-model',
      limits: { maxPromptChars: 9216, maxSteps: 6 },
      contextWindow: { tokens: 4096, assumed: false },
      providerId: 'local:l1',
    })
  })

  test("a local provider's own name is the label; 8,192 tokens when the context is unknown", () => {
    const info = localInfo(
      localServer({ hostingClass: 'orgHosted', baseUrl: 'http://10.0.0.5:8000/v1', contextTokens: null }),
      localEntry({ name: 'Desk server' })
    )
    expect(info?.label).toBe('Desk server')
    expect(info?.limits).toEqual({ maxPromptChars: 18432, maxSteps: 6 })
  })

  test('no URL or class: no engine', () => {
    expect(localInfo(localServer({ baseUrl: null }))).toBeNull()
    expect(localInfo(localServer({ hostingClass: null }))).toBeNull()
  })

  test('gateway: the provider name as label, 10 steps, the instance prompt cap', () => {
    expect(gatewayInfo()).toEqual({
      id: 'gateway',
      hostingClass: 'cloud',
      label: 'My OpenAI',
      model: 'gateway-model',
      limits: { maxPromptChars: 100000, maxSteps: 10 },
      providerId: 'acct:a1',
    })
    expect(gatewayInfo(gatewayEntry(), null)?.limits.maxPromptChars).toBe(200000)
    expect(gatewayInfo(gatewayEntry({ hostingClass: null }))).toBeNull()
  })

  test('Arena default is labelled by its admin provider type', () => {
    const entry = gatewayEntry({ id: 'arena-default', kind: 'arenaDefault', type: 'OpenAI', name: 'Arena default' })
    expect(gatewayInfo(entry)?.label).toBe('OpenAI')
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

  test('refuses a server without a known hosting class', () => {
    const { fetchImpl } = recorder(async () => completion('x'))
    expect(() => createLocalServerEngine({ localServer: localServer({ hostingClass: null }), fetchImpl })).toThrow(
      'aiNoEngineAvailable'
    )
  })

  test('refuses a server without a chosen model', () => {
    const { fetchImpl } = recorder(async () => completion('x'))
    expect(() => createLocalServerEngine({ localServer: localServer({ modelId: null }), fetchImpl })).toThrow(
      'aiNoEngineAvailable'
    )
  })
})

describe('createGatewayEngine', () => {
  const engine = gatewayInfo() as AiSelectedEngine

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
  })

  test('refuses an engine without a provider', () => {
    expect(() =>
      createGatewayEngine({ engine: { ...engine, providerId: undefined }, createGatewayModel: () => ({}) as any })
    ).toThrow('aiNoEngineAvailable')
  })
})
