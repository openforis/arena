import { MockLanguageModelV4 } from 'ai/test'

import { ENV } from '@core/processUtils'
import { AiLimits } from '@common/ai/limits'
import { createSseParser } from '@common/ai/sseParser'
import { handleModelRequest } from '@server/modules/ai/service/gateway/modelGateway'
import { createRateLimiter } from '@server/modules/ai/service/gateway/rateLimiter'
import * as ProviderRegistry from '@server/modules/ai/service/providerRegistry'
import {
  createResponseLimitedFetch,
  getProviderResponseLimits,
  limitResponseBytes,
  readTextCapped,
} from '@server/modules/ai/service/responseLimits'
import { createVercelAiSdkModel } from '@server/modules/ai/service/vercelAiSdkProvider'
import { toAiSystemError } from '@server/modules/ai/service/gateway/errorMapping'

import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'
import { createFakeRequest, createFakeResponse, parseSseWrites } from '@test/unit/utils/fakeExpress'

const TOO_LARGE = 'aiProviderResponseTooLarge'
const encoder = new TextEncoder()

/**
 * Builds a response body that never ends: it produces `chunk` each time it is read, and counts the reads.
 * @param {string} chunk - Text of each chunk.
 * @returns {object} The body and what happened to it.
 */
const endlessBody = (chunk: string) => {
  const state = { pulls: 0, cancelled: false }
  const body = new ReadableStream<Uint8Array>(
    {
      pull(controller) {
        state.pulls += 1
        controller.enqueue(encoder.encode(chunk))
      },
      cancel() {
        state.cancelled = true
      },
    },
    { highWaterMark: 0 }
  )
  return { body, state }
}

/**
 * Returns what a call fails with.
 * @param {PromiseLike<unknown>} call - The call.
 * @returns {Promise<any>} The error.
 */
const rejectionOf = (call: PromiseLike<unknown>): Promise<any> => Promise.resolve(call).catch((error) => error)

const delta = (text: string) => `data: {"type":"text-delta","delta":"${text}"}\n\n`

describe('SSE parser: caps per frame and per response (323)', () => {
  const create = (limits: { maxFrameChars?: number; maxTotalChars?: number }) => {
    const events: unknown[] = []
    const parser = createSseParser({ onEvent: (event) => events.push(event), limits })
    return { parser, events }
  }

  test('a frame that never ends is refused once it is over the frame cap', async () => {
    const { parser } = create({ maxFrameChars: 50 })
    parser.push('data: {"a":"' + 'x'.repeat(30))
    const error = await expectSystemErrorKey(() => parser.push('x'.repeat(30)), TOO_LARGE)
    expect(error.statusCode).toBe(502)
  })

  test('a complete frame over the cap is refused too, in one chunk', async () => {
    const { parser, events } = create({ maxFrameChars: 50 })
    await expectSystemErrorKey(() => parser.push(`data: {"a":"${'x'.repeat(60)}"}\n\n`), TOO_LARGE)
    expect(events).toEqual([])
  })

  test('many small frames are fine: the frame cap is not a response cap', () => {
    const { parser, events } = create({ maxFrameChars: 30 })
    for (let index = 0; index < 100; index += 1) parser.push('data: {"a":1}\n\n')
    expect(events).toHaveLength(100)
  })

  test('the response cap counts everything that was pushed', async () => {
    const { parser, events } = create({ maxTotalChars: 50 })
    parser.push('data: {"a":1}\n\n')
    parser.push('data: {"a":2}\n\n')
    expect(events).toHaveLength(2)
    parser.push('data: {"a":3}\n\n')
    await expectSystemErrorKey(() => parser.push('data: {"a":4}\n\n'), TOO_LARGE)
  })

  test('a frame exactly at the cap is accepted', () => {
    const frame = 'data: {"a":1}'
    const { parser, events } = create({ maxFrameChars: frame.length })
    parser.push(`${frame}\n\n`)
    expect(events).toEqual([{ a: 1 }])
  })

  test('a frame delivered in many tiny chunks is parsed in linear time', () => {
    // scanning the pending text again on every chunk takes tens of seconds for this input
    const { parser, events } = create({ maxFrameChars: 1000000 })
    const frame = `data: {"text":"${'x'.repeat(300000)}"}`
    const start = Date.now()
    for (const char of frame) parser.push(char)
    parser.push('\n\n')
    expect(Date.now() - start).toBeLessThan(2000)
    expect(events).toEqual([{ text: 'x'.repeat(300000) }])
  })

  test('a delimiter split between two chunks, in any place, ends the frame', () => {
    const wire = 'data: {"a":1}\n\ndata: {"b":2}\n\n\ndata: {"c":3}\n\n'
    for (let cut = 0; cut <= wire.length; cut += 1) {
      const { parser, events } = create({})
      parser.push(wire.slice(0, cut))
      parser.push(wire.slice(cut))
      expect(events).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }])
    }
  })

  test('a trailing frame without delimiter is flushed at the end', () => {
    const { parser, events } = create({})
    parser.push('data: {"a":1}\n\ndata: {"b":')
    parser.push('2}')
    parser.end()
    expect(events).toEqual([{ a: 1 }, { b: 2 }])
  })

  test('without limits nothing is capped', () => {
    const events: unknown[] = []
    const parser = createSseParser({ onEvent: (event) => events.push(event) })
    parser.push(`data: {"a":"${'x'.repeat(5000000)}"}\n\n`)
    expect(events).toHaveLength(1)
  })
})

describe('response limits: the body of a provider answer (323)', () => {
  test('a body under the cap is passed as it is, with its status and headers', async () => {
    const limited = limitResponseBytes(new Response('hello', { status: 201, headers: { 'X-Test': '1' } }), 100)
    expect(limited.status).toBe(201)
    expect(limited.headers.get('x-test')).toBe('1')
    expect(await limited.text()).toBe('hello')
  })

  test('a body over the cap fails while it is read, and the upstream is cancelled', async () => {
    const { body, state } = endlessBody('x'.repeat(100))
    const limited = limitResponseBytes(new Response(body), 1000)
    await expectSystemErrorKey(() => limited.text(), TOO_LARGE)
    expect(state.pulls).toBeLessThan(20)
    expect(state.cancelled).toBe(true)
  })

  test('a declared length over the cap is refused before reading', async () => {
    const { body, state } = endlessBody('x')
    const response = new Response(body, { headers: { 'Content-Length': '5000' } })
    await expectSystemErrorKey(() => limitResponseBytes(response, 1000), TOO_LARGE)
    expect(state.cancelled).toBe(true)
  })

  test('a response without body passes', () => {
    const response = new Response(null, { status: 204 })
    expect(limitResponseBytes(response, 10)).toBe(response)
  })

  test('the limited fetch limits what the wrapped fetch answers', async () => {
    const { body } = endlessBody('x'.repeat(100))
    const limitedFetch = createResponseLimitedFetch(async () => new Response(body), 500)
    const response = await limitedFetch('https://llm.example/v1', {})
    await expectSystemErrorKey(() => response.text(), TOO_LARGE)
  })

  test('readTextCapped reads at most the cap, then stops the upstream', async () => {
    const { body, state } = endlessBody('y'.repeat(100))
    const text = await readTextCapped(new Response(body), 450)
    expect(text.length).toBeGreaterThan(0)
    expect(text.length).toBeLessThanOrEqual(450)
    expect(state.pulls).toBeLessThan(10)
    expect(state.cancelled).toBe(true)
  })

  test('readTextCapped returns a short body whole', async () => {
    expect(await readTextCapped(new Response('short body'), 450)).toBe('short body')
  })

  test('the caps of a provider answer are in the shared limits', () => {
    expect(AiLimits.providerResponseMaxBytes).toBeGreaterThan(AiLimits.providerFrameMaxChars)
    expect(AiLimits.providerErrorBodyMaxBytes).toBeLessThan(AiLimits.providerFrameMaxChars)
  })
})

describe('response limits: the vercel-ai-sdk provider (323)', () => {
  const baseUrl = 'https://agent.example/chat'
  const callOptions = { prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hi' }] }] } as any

  test('generate: an answer over the response cap fails with aiProviderResponseTooLarge and closes the upstream', async () => {
    const { body, state } = endlessBody(delta('word '.repeat(20)))
    const model = createVercelAiSdkModel({
      baseUrl,
      fetchImpl: async () => new Response(body, { status: 200 }),
      limits: { maxResponseBytes: 2000 },
    })
    const error = await expectSystemErrorKey(() => model.doGenerate(callOptions), TOO_LARGE)
    expect(error.statusCode).toBe(502)
    expect(state.cancelled).toBe(true)
    expect(state.pulls).toBeLessThan(30)
  })

  test('stream: an answer over the response cap ends with an error part and no finish', async () => {
    const { body, state } = endlessBody(delta('word '.repeat(20)))
    const model = createVercelAiSdkModel({
      baseUrl,
      fetchImpl: async () => new Response(body, { status: 200 }),
      limits: { maxResponseBytes: 2000 },
    })
    const { stream } = await model.doStream(callOptions)
    const types: string[] = []
    let lastError: any
    const reader = stream.getReader()
    for (let result = await reader.read(); !result.done; result = await reader.read()) {
      types.push(result.value.type)
      if (result.value.type === 'error') lastError = result.value.error
    }
    expect(types[types.length - 1]).toBe('error')
    expect(types).not.toContain('finish')
    expect(lastError.key).toBe(TOO_LARGE)
    expect(state.cancelled).toBe(true)
  })

  test('a frame that never ends is refused by the frame cap', async () => {
    const { body } = endlessBody('data: {"type":"text-delta","delta":"never ends')
    const model = createVercelAiSdkModel({
      baseUrl,
      fetchImpl: async () => new Response(body, { status: 200 }),
      limits: { maxFrameChars: 500, maxResponseBytes: 1000000 },
    })
    await expectSystemErrorKey(() => model.doGenerate(callOptions), TOO_LARGE)
  })

  test('an answer under the caps is not affected', async () => {
    const text = 'a'.repeat(1000)
    const frames = [delta(text), delta(text), 'data: [DONE]\n\n']
    const model = createVercelAiSdkModel({
      baseUrl,
      fetchImpl: async () => new Response(frames.join(''), { status: 200 }),
      limits: { maxResponseBytes: 10000, maxFrameChars: 2000 },
    })
    const result = await model.doGenerate(callOptions)
    expect(result.content).toEqual([{ type: 'text', text: text + text }])
  })

  test('an error body is read up to its cap only, and the message keeps 500 characters at most', async () => {
    const { body, state } = endlessBody('z'.repeat(1000))
    const model = createVercelAiSdkModel({
      baseUrl,
      fetchImpl: async () => new Response(body, { status: 500 }),
      limits: { maxErrorBodyBytes: 3000 },
    })
    const error = await rejectionOf(model.doGenerate(callOptions))
    expect(error.message).toMatch(/^AI SDK upstream HTTP 500: z+$/)
    expect(error.message.length).toBeLessThanOrEqual('AI SDK upstream HTTP 500: '.length + 500)
    expect(state.pulls).toBeLessThan(10)
    expect(state.cancelled).toBe(true)
  })
})

describe('response limits: user-chosen OpenAI-compatible endpoints (323)', () => {
  afterEach(() => jest.restoreAllMocks())

  const model = () =>
    ProviderRegistry.buildModel({ provider: 'openai-compatible', model: 'm', baseUrl: 'https://llm.example/v1' })
  const callOptions = { prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hi' }] }] } as any

  test('generate: an endless answer is cut at the response cap', async () => {
    const { body, state } = endlessBody(`{"choices":[{"message":{"content":"${'a'.repeat(1000000)}`)
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response(body, { status: 200 }))
    const error = await rejectionOf(model().doGenerate(callOptions))
    expect(toAiSystemError(error).key).toBe(TOO_LARGE)
    expect(state.cancelled).toBe(true)
    expect(state.pulls).toBeLessThanOrEqual(Math.ceil(AiLimits.providerResponseMaxBytes / 1000000) + 2)
  })

  test('stream: an endless answer ends the stream with the error', async () => {
    const { body, state } = endlessBody(`data: {"choices":[{"delta":{"content":"${'a'.repeat(1000000)}"}}]}\n\n`)
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response(body, { status: 200 }))
    const { stream } = await model().doStream(callOptions)
    const reader = stream.getReader()
    let failure: unknown
    try {
      for (let result = await reader.read(); !result.done; result = await reader.read()) {
        if (result.value.type === 'error') failure = result.value.error
      }
    } catch (error) {
      failure = error
    }
    expect(toAiSystemError(failure).key).toBe(TOO_LARGE)
    expect(state.cancelled).toBe(true)
  })
})

describe('response limits: the gateway waits for the client to drain (323)', () => {
  const user: any = { uuid: 'user-1', prefs: { ai: { featuresEnabled: true, featureToggles: { chat: true } } } }
  const body = {
    feature: 'chatbot',
    dataClass: 'schema',
    stream: true,
    call: { prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hi' }] }] },
  }

  /**
   * Builds a response whose socket buffer is full: `write` answers false until `drain` is emitted.
   * @returns {object} The fake response.
   */
  const createBackpressuredResponse = () => {
    const res = createFakeResponse()
    res.write = (chunk: string) => {
      res.headersSent = true
      res.writes.push(chunk)
      return false
    }
    return res
  }

  /**
   * Builds a provider that produces one part per read, counting the reads.
   * @param {number} parts - Number of text deltas before the end.
   * @returns {object} The model and the read counter.
   */
  const createCountingModel = (parts: number) => {
    const state = { pulls: 0, cancelled: false }
    const model = new MockLanguageModelV4({
      doStream: async () =>
        ({
          stream: new ReadableStream(
            {
              pull(controller) {
                state.pulls += 1
                if (state.pulls <= parts) controller.enqueue({ type: 'text-delta', id: 't', delta: `d${state.pulls}` })
                else controller.close()
              },
              cancel() {
                state.cancelled = true
              },
            },
            { highWaterMark: 0 }
          ),
        }) as any,
    })
    return { model, state }
  }

  const createDeps = (model: any, timeoutMs = 5000) => ({
    resolveModel: async () => ({ model, meta: { source: 'user', provider: 'openai', model: 'm' } }),
    assertPolicyAllows: async () => {},
    rateLimiter: createRateLimiter({ limitPerMinute: 0 }),
    recordTelemetry: () => {},
    logError: () => {},
    limits: { maxPromptChars: 100000, maxOutputTokens: 100, timeoutMs },
    gateEnv: { aiFeaturesEnabled: true, aiFeatureFlags: null },
  })

  const tick = () => new Promise((resolve) => setTimeout(resolve, 20))

  test('nothing more is read from the provider while the client socket is full, and it resumes on drain', async () => {
    const { model, state } = createCountingModel(3)
    const res = createBackpressuredResponse()
    const done = handleModelRequest({ req: createFakeRequest(body), res, user, deps: createDeps(model) })
    await tick()
    const pullsWhileFull = state.pulls
    expect(pullsWhileFull).toBeLessThanOrEqual(2)
    await tick()
    expect(state.pulls).toBe(pullsWhileFull)
    for (let index = 0; index < 10 && !res.writableEnded; index += 1) {
      res.emit('drain')
      await tick()
    }
    await done
    expect(parseSseWrites(res).map((frame: any) => frame.delta ?? frame)).toEqual(['d1', 'd2', 'd3', '[DONE]'])
  })

  test('a client that goes away while the socket is full releases the call and stops the provider', async () => {
    const { model, state } = createCountingModel(50)
    const res = createBackpressuredResponse()
    const done = handleModelRequest({ req: createFakeRequest(body), res, user, deps: createDeps(model) })
    await tick()
    res.disconnect()
    await done
    expect(state.cancelled).toBe(true)
  })

  test('a client that never drains is cut by the timeout of the call', async () => {
    const { model, state } = createCountingModel(50)
    const res = createBackpressuredResponse()
    await handleModelRequest({ req: createFakeRequest(body), res, user, deps: createDeps(model, 100) })
    expect(state.cancelled).toBe(true)
    expect(res.writableEnded).toBe(true)
  })

  test('a socket that accepts everything is not slowed down', async () => {
    const { model, state } = createCountingModel(5)
    const res = createFakeResponse()
    await handleModelRequest({ req: createFakeRequest(body), res, user, deps: createDeps(model) })
    expect(state.pulls).toBe(6)
    expect(parseSseWrites(res).map((frame: any) => frame.delta ?? frame)).toEqual([
      'd1',
      'd2',
      'd3',
      'd4',
      'd5',
      '[DONE]',
    ])
  })
})

describe('response limits: the cap follows the configured output tokens (323)', () => {
  const MIB = 1024 * 1024
  const originalMaxOutputTokens = ENV.aiMaxOutputTokens
  const callOptions = { prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hi' }] }] } as any

  afterEach(() => {
    ENV.aiMaxOutputTokens = originalMaxOutputTokens
    jest.restoreAllMocks()
  })

  test('8 MiB and 1 MiB frames are the floor: the default output tokens keep them', () => {
    expect(getProviderResponseLimits(4096)).toEqual({ maxResponseBytes: 8 * MIB, maxFrameChars: MIB })
    expect(getProviderResponseLimits(100)).toEqual({ maxResponseBytes: 8 * MIB, maxFrameChars: MIB })
  })

  test('a bigger output token limit raises the caps', () => {
    const limits = getProviderResponseLimits(100000)
    expect(limits.maxResponseBytes).toBe(100000 * AiLimits.providerBytesPerOutputToken)
    expect(limits.maxResponseBytes).toBeGreaterThan(8 * MIB)
    expect(limits.maxFrameChars).toBe(100000 * AiLimits.providerFrameCharsPerOutputToken)
    expect(limits.maxFrameChars).toBeGreaterThan(MIB)
  })

  test.each([0, -5, Number.NaN, Number.POSITIVE_INFINITY])('a nonsense token limit (%s) gives the floor', (tokens) => {
    expect(getProviderResponseLimits(tokens)).toEqual({ maxResponseBytes: 8 * MIB, maxFrameChars: MIB })
  })

  // about 9 MiB of text in frames of 1000 characters
  const longAnswerFrames = (makeFrame: (text: string) => string) =>
    Array.from({ length: 9500 }, () => makeFrame('a'.repeat(1000)))

  test('vercel-ai-sdk: a long legitimate answer passes when the output token limit allows it, else it is cut', async () => {
    const body = [...longAnswerFrames(delta), 'data: [DONE]\n\n'].join('')
    const buildModel = () =>
      createVercelAiSdkModel({ baseUrl: 'https://agent.example/chat', fetchImpl: async () => new Response(body) })
    ENV.aiMaxOutputTokens = 4096
    await expectSystemErrorKey(() => buildModel().doGenerate(callOptions), TOO_LARGE)
    ENV.aiMaxOutputTokens = 10000
    const result = await buildModel().doGenerate(callOptions)
    expect((result.content[0] as any).text).toHaveLength(9500 * 1000)
  })

  test('openai-compatible: the same, for a streamed answer', async () => {
    const frame = (text: string) => `data: {"choices":[{"index":0,"delta":{"content":"${text}"}}]}\n\n`
    const body = [...longAnswerFrames(frame), 'data: [DONE]\n\n'].join('')
    const readAll = async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue(new Response(body, { status: 200 }))
      const model = ProviderRegistry.buildModel({
        provider: 'openai-compatible',
        model: 'm',
        baseUrl: 'https://llm.example/v1',
      })
      let text = ''
      let failure: unknown
      try {
        const { stream } = await model.doStream(callOptions)
        const reader = stream.getReader()
        for (let result = await reader.read(); !result.done; result = await reader.read()) {
          if (result.value.type === 'text-delta') text += result.value.delta
          if (result.value.type === 'error') failure = result.value.error
        }
      } catch (error) {
        failure = error
      }
      return { text, failure }
    }
    ENV.aiMaxOutputTokens = 4096
    expect(toAiSystemError((await readAll()).failure).key).toBe(TOO_LARGE)
    ENV.aiMaxOutputTokens = 10000
    const { text, failure } = await readAll()
    expect(failure).toBeUndefined()
    expect(text).toHaveLength(9500 * 1000)
  })
})
