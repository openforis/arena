import { streamText } from 'ai'

import { getGatewayEngineInfo, getLocalServerEngineInfo } from '@webapp/ai/engines/engineInfo'
import { createLocalServerEngine } from '@webapp/ai/engines/localServerEngine'
import {
  CHARS_PER_TOKEN,
  DEFAULT_LOCAL_CONTEXT_TOKENS,
  getLocalServerContextWindow,
} from '@webapp/ai/engines/localServerProbe'
import type { AiLocalServerCapability } from '@webapp/ai/engines/types'

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

const chunk = (body: object) =>
  `data: ${JSON.stringify({ id: 'c1', object: 'chat.completion.chunk', created: 0, model: 'local-model', ...body })}\n\n`

// an OpenAI-compatible stream whose last chunk carries the usage (sent when include_usage is asked)
const sseWithUsage = () =>
  new Response(
    [
      chunk({ choices: [{ index: 0, delta: { content: 'ok' }, finish_reason: null }] }),
      chunk({ choices: [{ index: 0, delta: {}, finish_reason: 'stop' }] }),
      chunk({ choices: [], usage: { prompt_tokens: 120, completion_tokens: 8, total_tokens: 128 } }),
      'data: [DONE]\n\n',
    ].join(''),
    { status: 200, headers: { 'Content-Type': 'text/event-stream' } }
  )

describe('local engine usage and context window (203)', () => {
  test('the context window: the probed size, or 8,192 assumed', () => {
    expect(CHARS_PER_TOKEN).toBe(3)
    expect(DEFAULT_LOCAL_CONTEXT_TOKENS).toBe(8192)
    expect(getLocalServerContextWindow(32768)).toEqual({ tokens: 32768, assumed: false })
    expect(getLocalServerContextWindow(null)).toEqual({ tokens: 8192, assumed: true })
    expect(getLocalServerContextWindow(0)).toEqual({ tokens: 8192, assumed: true })
    expect(getLocalServerEngineInfo(localServer())?.contextWindow).toEqual({ tokens: 4096, assumed: false })
    expect(getLocalServerEngineInfo(localServer({ contextTokens: null }))?.contextWindow).toEqual({
      tokens: 8192,
      assumed: true,
    })
  })

  test('the gateway has no known window', () => {
    const gateway = getGatewayEngineInfo({
      available: true,
      hostingClass: 'cloud',
      provider: 'openai',
      model: 'gateway-model',
      maxPromptChars: 100000,
    })
    expect(gateway).not.toBeNull()
    expect(gateway?.contextWindow).toBeUndefined()
  })

  test('a stream asks the server for its usage, and the usage reaches the AI SDK', async () => {
    const bodies: string[] = []
    const fetchImpl = async (_url: string, init?: RequestInit) => {
      bodies.push(String(init?.body))
      return sseWithUsage()
    }
    const engine = createLocalServerEngine({ localServer: localServer(), fetchImpl })
    const result = streamText({
      model: engine.createModel({ feature: 'expressionExplain', dataClass: 'schema' }),
      prompt: 'hi',
      maxRetries: 0,
    })
    let text = ''
    for await (const delta of result.textStream) text += delta
    expect(text).toBe('ok')
    expect(JSON.parse(bodies[0]).stream_options).toEqual({ include_usage: true })
    const usage = await result.usage
    expect(usage.inputTokens).toBe(120)
    expect(usage.outputTokens).toBe(8)
  })
})
