import { MockLanguageModelV4, convertArrayToReadableStream } from 'ai/test'

import { handleModelRequest } from '@server/modules/ai/service/gateway/modelGateway'
import { createRateLimiter } from '@server/modules/ai/service/gateway/rateLimiter'
import { createFakeRequest, createFakeResponse, parseSseWrites } from '@test/unit/utils/fakeExpress'

const user: any = {
  uuid: 'user-1',
  prefs: { ai: { featuresEnabled: true, featureToggles: { expressions: true, chat: true } } },
}
const prompt = [{ role: 'user', content: [{ type: 'text', text: 'Hi' }] }]
const body = (override = {}) => ({
  surveyId: 1,
  feature: 'expressionGenerate',
  dataClass: 'schema',
  stream: false,
  call: { prompt },
  ...override,
})
const usage = { inputTokens: { total: 3 }, outputTokens: { total: 2 } }
const finishReason = { unified: 'stop', raw: 'stop' }

const generateModel = () =>
  new MockLanguageModelV4({
    doGenerate: async () => ({ content: [{ type: 'text', text: 'ok' }], finishReason, usage, warnings: [] }) as any,
  })

const streamModel = (parts: any[]) =>
  new MockLanguageModelV4({ doStream: async () => ({ stream: convertArrayToReadableStream(parts) }) as any })

const textParts = [
  { type: 'stream-start', warnings: [] },
  { type: 'text-start', id: 't' },
  { type: 'text-delta', id: 't', delta: 'Hel' },
  { type: 'text-delta', id: 't', delta: 'lo' },
  { type: 'text-end', id: 't' },
  { type: 'finish', finishReason, usage },
]

// a stream that never ends until aborted (to test timeout / disconnect)
const hangingModel = () => {
  const state: { signal?: AbortSignal } = {}
  const model = new MockLanguageModelV4({
    doStream: async ({ abortSignal }) => {
      state.signal = abortSignal
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue({ type: 'stream-start', warnings: [] })
          controller.enqueue({ type: 'text-start', id: 't' })
          controller.enqueue({ type: 'text-delta', id: 't', delta: 'partial' })
          abortSignal?.addEventListener('abort', () => controller.error(abortSignal.reason))
        },
      })
      return { stream } as any
    },
  })
  return { model, state }
}

const createDeps = (model: any, overrides: any = {}) => {
  const telemetry: any[] = []
  const logged: string[] = []
  const deps = {
    resolveModel: async () => ({ model, meta: { source: 'user', provider: 'openai', model: 'm' } }),
    assertPolicyAllows: async () => {},
    rateLimiter: createRateLimiter({ limitPerMinute: 0 }),
    recordTelemetry: (ctx: any, outcome: any) => telemetry.push({ ctx, outcome }),
    logError: (message: string) => logged.push(message),
    limits: { maxPromptChars: 1000, maxOutputTokens: 100, timeoutMs: 5000 },
    gateEnv: { aiFeaturesEnabled: true, aiFeatureFlags: null },
    ...overrides,
  }
  return { deps, telemetry, logged }
}

const run = async (requestBody: any, deps: any) => {
  const req = createFakeRequest(requestBody)
  const res = createFakeResponse()
  await handleModelRequest({ req, res, user, deps })
  return res
}

describe('handleModelRequest: generate', () => {
  test('forwards the sanitized call and returns the wire result', async () => {
    const model = generateModel()
    const { deps, telemetry } = createDeps(model)
    const res = await run(body({ call: { prompt, maxOutputTokens: 5000, providerOptions: { x: 1 } } }), deps)

    expect(res.statusCode).toBe(200)
    expect(res.body.content).toEqual([{ type: 'text', text: 'ok' }])
    expect(model.doGenerateCalls[0].maxOutputTokens).toBe(100)
    expect(model.doGenerateCalls[0].providerOptions).toBeUndefined()
    expect(model.doGenerateCalls[0].abortSignal).toBeDefined()
    expect(telemetry).toHaveLength(1)
    expect(telemetry[0].ctx.feature).toBe('expressionGenerate')
    expect(telemetry[0].outcome.usage).toEqual(usage)
  })

  test.each([
    [body({ feature: 'nope' }), 400, 'aiFeatureUnknown'],
    [body({ feature: 'dataDictionary' }), 400, 'aiFeatureUnknown'],
    [body({ call: { prompt, tools: [{}] } }), 400, 'aiCallInvalid'],
    [
      body({ call: { prompt: [{ role: 'user', content: [{ type: 'text', text: 'x'.repeat(1001) }] }] } }),
      413,
      'aiPromptTooLarge',
    ],
    [body({ feature: 'translation' }), 403, 'aiFeatureDisabled'], // category off for this user
  ])('refuses %# with %p %s, without calling the model', async (requestBody, status, key) => {
    const model = generateModel()
    const { deps, telemetry } = createDeps(model)
    const res = await run(requestBody, deps)
    expect(res.statusCode).toBe(status)
    expect(res.body).toMatchObject({ status: 'error', key })
    expect(model.doGenerateCalls).toHaveLength(0)
    expect(telemetry).toHaveLength(0)
  })

  test('AI switched off on the server → 404 aiFeaturesDisabled', async () => {
    const { deps } = createDeps(generateModel(), { gateEnv: { aiFeaturesEnabled: false, aiFeatureFlags: null } })
    const res = await run(body(), deps)
    expect(res.statusCode).toBe(404)
    expect(res.body.key).toBe('aiFeaturesDisabled')
  })

  test('rate limited → 429 aiRateLimited', async () => {
    const { deps } = createDeps(generateModel(), { rateLimiter: createRateLimiter({ limitPerMinute: 1 }) })
    await run(body(), deps)
    const res = await run(body(), deps)
    expect(res.statusCode).toBe(429)
    expect(res.body.key).toBe('aiRateLimited')
  })

  test('an upstream failure is mapped, logged in full and recorded once', async () => {
    const model = new MockLanguageModelV4({
      doGenerate: async () => {
        throw Object.assign(new TypeError('fetch failed'), { cause: new Error('ECONNREFUSED 10.0.0.1') })
      },
    })
    const { deps, telemetry, logged } = createDeps(model)
    const res = await run(body(), deps)
    expect(res.statusCode).toBe(502)
    expect(res.body).toEqual({ status: 'error', key: 'aiProviderUnavailable', params: {} })
    expect(JSON.stringify(res.body)).not.toMatch(/ECONNREFUSED/)
    expect(logged.join('\n')).toMatch(/ECONNREFUSED/)
    expect(telemetry).toHaveLength(1)
    expect(telemetry[0].outcome.error).toBeDefined()
  })

  test('no provider configured → aiNotConfigured from the resolver', async () => {
    const SystemError = (await import('@core/systemError')).default
    const { deps } = createDeps(generateModel(), {
      resolveModel: async () => {
        throw new SystemError('aiNotConfigured', {}, 503)
      },
    })
    const res = await run(body(), deps)
    expect(res.statusCode).toBe(503)
    expect(res.body.key).toBe('aiNotConfigured')
  })

  test('the policy hook gets survey, data class and hosting class, and can refuse before the provider call', async () => {
    const SystemError = (await import('@core/systemError')).default
    const policyCalls: any[] = []
    const model = generateModel()
    const { deps } = createDeps(model, {
      assertPolicyAllows: async (params: any) => {
        policyCalls.push(params)
        throw new SystemError('aiPolicyRefused', {}, 403)
      },
    })
    const res = await run(body(), deps)
    expect(policyCalls).toEqual([{ surveyId: 1, dataClass: 'schema', hostingClass: null }])
    expect(res.statusCode).toBe(403)
    expect(model.doGenerateCalls).toHaveLength(0)
  })

  test('the default policy allows everything (step A)', async () => {
    const { assertPolicyAllows } = await import('@server/modules/ai/service/gateway/policy')
    await expect(
      assertPolicyAllows({ surveyId: 1, dataClass: 'data', hostingClass: 'external' })
    ).resolves.toBeUndefined()
  })
})

describe('handleModelRequest: stream', () => {
  test('streams the wire parts and ends with [DONE]', async () => {
    const { deps, telemetry } = createDeps(streamModel(textParts))
    const res = await run(body({ stream: true }), deps)

    expect(res.headers['content-type']).toBe('text/event-stream')
    const frames = parseSseWrites(res)
    expect(frames.at(-1)).toBe('[DONE]')
    expect(
      frames
        .filter((f: any) => f.type === 'text-delta')
        .map((f: any) => f.delta)
        .join('')
    ).toBe('Hello')
    expect(frames.find((f: any) => f.type === 'finish')).toEqual({ type: 'finish', finishReason, usage })
    expect(telemetry).toHaveLength(1)
    expect(telemetry[0].outcome.usage).toEqual(usage)
    expect(res.writableEnded).toBe(true)
  })

  test('an error part is forwarded as a key only', async () => {
    const parts = [
      { type: 'stream-start', warnings: [] },
      { type: 'error', error: new Error('secret upstream detail') },
    ]
    const { deps } = createDeps(streamModel(parts))
    const res = await run(body({ stream: true }), deps)
    const frames = parseSseWrites(res)
    expect(frames).toContainEqual({ type: 'error', error: { key: 'aiProviderUnavailable', params: {} } })
    expect(res.writes.join('')).not.toMatch(/secret upstream detail/)
  })

  test('timeout mid-stream: upstream aborted, aiRequestTimeout sent after the partial text, recorded once', async () => {
    const { model, state } = hangingModel()
    const { deps, telemetry } = createDeps(model, {
      limits: { maxPromptChars: 1000, maxOutputTokens: 100, timeoutMs: 50 },
    })
    const res = await run(body({ stream: true }), deps)

    const frames = parseSseWrites(res)
    expect(frames).toContainEqual({ type: 'text-delta', id: 't', delta: 'partial' })
    expect(frames).toContainEqual({ type: 'error', error: { key: 'aiRequestTimeout', params: {} } })
    expect(frames.at(-1)).toBe('[DONE]')
    expect(state.signal.aborted).toBe(true)
    expect(telemetry).toHaveLength(1)
    expect(telemetry[0].outcome.error).toBeDefined()
  })

  test('client disconnect mid-stream: upstream aborted, nothing more written, recorded once', async () => {
    const { model, state } = hangingModel()
    const { deps, telemetry } = createDeps(model)
    const req = createFakeRequest(body({ stream: true }))
    const res = createFakeResponse()
    const unhandled: unknown[] = []
    const onUnhandled = (reason: unknown) => unhandled.push(reason)
    process.on('unhandledRejection', onUnhandled)
    try {
      const done = handleModelRequest({ req, res, user, deps })
      await new Promise((resolve) => setTimeout(resolve, 20))
      const writesBefore = res.writes.length
      res.disconnect()
      await done
      await new Promise((resolve) => setTimeout(resolve, 20))

      expect(state.signal.aborted).toBe(true)
      expect(res.writes.length).toBe(writesBefore)
      expect(telemetry).toHaveLength(1)
      expect(unhandled).toEqual([])
    } finally {
      process.off('unhandledRejection', onUnhandled)
    }
  })

  test('an error before the stream starts is a plain JSON error', async () => {
    const model = new MockLanguageModelV4({
      doStream: async () => {
        throw Object.assign(new Error('bad key'), { name: 'AI_APICallError' })
      },
    })
    const { deps } = createDeps(model)
    const res = await run(body({ stream: true }), deps)
    expect(res.statusCode).toBe(502)
    expect(res.body.key).toBe('aiProviderUnavailable')
    expect(res.writes).toEqual([])
  })
})

describe('mock provider canned answers', () => {
  const answer = async (system: string) => {
    const { mockAnswerFor } = await import('@server/modules/ai/service/mockProvider')
    return mockAnswerFor([{ role: 'system', content: system }] as any)
  }

  test('the two data query prompts get different answers (both mention the Data Explorer)', async () => {
    const summarize = await answer(
      'You are an assistant that names data queries in the Data Explorer of Open Foris Arena'
    )
    const generate = await answer(
      'You are an assistant that builds data queries for the Data Explorer of Open Foris Arena'
    )
    expect(JSON.parse(summarize)).toEqual({ name: 'mock_query', label: 'MOCK label', description: 'MOCK' })
    expect(JSON.parse(generate)).toMatchObject({ entity: 'tree', mode: 'raw' })
  })
})
