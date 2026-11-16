import { generateText, streamText } from 'ai'

import { createLocalServerEngine } from '@webapp/ai/engines/localServerEngine'
import { createGatewayTextGenerator } from '@webapp/ai/runtime/textGenerators'
import type { AiLocalServerCapability } from '@webapp/ai/engines/types'

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

const chunk = (delta: object, finishReason: string | null) =>
  `data: ${JSON.stringify({ id: 'c1', object: 'chat.completion.chunk', created: 0, model: 'local-model', choices: [{ index: 0, delta, finish_reason: finishReason }] })}\n\n`

/** An OpenAI-compatible stream of one text chunk per word. */
const sse = (words: string[]) =>
  new Response([...words.map((content) => chunk({ content }, null)), chunk({}, 'stop'), 'data: [DONE]\n\n'].join(''), {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  })

const completion = () =>
  new Response(
    JSON.stringify({
      id: 'c1',
      object: 'chat.completion',
      created: 0,
      model: 'local-model',
      choices: [{ index: 0, message: { role: 'assistant', content: 'ok' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )

/** Returns a fetch that records the request bodies and answers with `respond()`. */
const recorder = (respond: () => Response) => {
  const bodies: Record<string, unknown>[] = []
  const fetchImpl = async (_url: string, init?: RequestInit) => {
    bodies.push(JSON.parse(String(init?.body)))
    return respond()
  }
  return { bodies, fetchImpl }
}

const modelOptions = { feature: 'expressionExplain', dataClass: 'schema' } as const

describe('the local engine does not cap its output (370)', () => {
  test('no max_tokens is sent, whatever the context or the caller asks', async () => {
    const { bodies, fetchImpl } = recorder(completion)
    const engine = createLocalServerEngine({ localServer: localServer(), fetchImpl })
    const model = engine.createModel(modelOptions)
    await generateText({ model, prompt: 'hi', maxRetries: 0 })
    await generateText({ model, prompt: 'hi', maxOutputTokens: 100, maxRetries: 0 })
    expect(bodies.map((body) => 'max_tokens' in body)).toEqual([false, false])
  })

  test('a stream sends none either', async () => {
    const { bodies, fetchImpl } = recorder(() => sse(['ok']))
    const engine = createLocalServerEngine({ localServer: localServer({ contextTokens: 32768 }), fetchImpl })
    const result = streamText({ model: engine.createModel(modelOptions), prompt: 'hi', maxRetries: 0 })
    await result.consumeStream()
    expect('max_tokens' in bodies[0]).toBe(false)
  })
})

describe('reasoning of the local engine (370)', () => {
  test('a task call sends reasoning_effort none; a chat call (no provider options) does not', async () => {
    const { bodies, fetchImpl } = recorder(completion)
    const engine = createLocalServerEngine({ localServer: localServer(), fetchImpl })
    const model = engine.createModel(modelOptions)
    await createGatewayTextGenerator(model)({ prompt: 'translate' })
    await generateText({ model, prompt: 'chat', maxRetries: 0 })
    expect(bodies[0].reasoning_effort).toBe('none')
    expect('reasoning_effort' in bodies[1]).toBe(false)
  })
})

describe('the local engine does not send a part per token (370)', () => {
  test('tokens that arrive together reach the consumer as one delta, with the same text', async () => {
    const words = Array.from({ length: 200 }, (_, index) => `w${index} `)
    const { fetchImpl } = recorder(() => sse(words))
    const engine = createLocalServerEngine({ localServer: localServer(), fetchImpl })
    const result = streamText({ model: engine.createModel(modelOptions), prompt: 'hi', maxRetries: 0 })
    const deltas: string[] = []
    for await (const part of result.stream) {
      if (part.type === 'text-delta') deltas.push(part.text)
    }
    expect(deltas.join('')).toBe(words.join(''))
    // the whole response was available at once: far fewer parts than the 200 tokens
    expect(deltas.length).toBeLessThan(20)
  })

  test('reasoning is merged too, and stays apart from the answer', async () => {
    const { fetchImpl } = recorder(() => sse(['<think>a', ' b', ' c</think>', 'Hello', ' there']))
    const engine = createLocalServerEngine({ localServer: localServer(), fetchImpl })
    const result = streamText({ model: engine.createModel(modelOptions), prompt: 'hi', maxRetries: 0 })
    let text = ''
    let reasoning = ''
    const types: string[] = []
    for await (const part of result.stream) {
      if (part.type === 'text-delta') text += part.text
      if (part.type === 'reasoning-delta') reasoning += part.text
      if (part.type === 'text-delta' || part.type === 'reasoning-delta') types.push(part.type)
    }
    expect(reasoning).toBe('a b c')
    expect(text).toBe('Hello there')
    expect(types).toEqual(['reasoning-delta', 'text-delta'])
  })
})
