import { generateText } from 'ai'

import { createGatewayModel } from '@webapp/ai/runtime/gatewayModel'
import { createGatewayTextGenerator, streamTextChunks } from '@webapp/ai/runtime/textGenerators'

const encoder = new TextEncoder()

const sse = (frames: object[], { done = true } = {}) =>
  new Response(
    new ReadableStream({
      start(controller) {
        for (const frame of frames) controller.enqueue(encoder.encode(`data: ${JSON.stringify(frame)}\n\n`))
        if (done) controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    }),
    { status: 200, headers: { 'Content-Type': 'text/event-stream' } }
  )

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const usage = { inputTokens: { total: 1 }, outputTokens: { total: 2 } }
const finish = { type: 'finish', finishReason: { unified: 'stop' }, usage }

const modelWith = (respond: (body: any) => Response) => {
  const requests: any[] = []
  const fetchImpl = async (url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body))
    requests.push({ url, body, signal: init.signal })
    return respond(body)
  }
  const model = createGatewayModel({ feature: 'expressionGenerate', dataClass: 'schema', surveyId: 7, fetchImpl })
  return { model, requests }
}

describe('gateway model: generate', () => {
  test('posts the envelope and returns the text', async () => {
    const { model, requests } = modelWith(() =>
      json({ content: [{ type: 'text', text: 'ok' }], finishReason: { unified: 'stop' }, usage, warnings: [] })
    )
    const generateTextFn = createGatewayTextGenerator(model)
    expect(await generateTextFn({ system: 'S', prompt: 'P' })).toBe('ok')

    const [{ url, body }] = requests
    expect(url).toBe('/api/ai/model')
    expect(body).toMatchObject({ surveyId: 7, feature: 'expressionGenerate', dataClass: 'schema', stream: false })
    expect(body.call.prompt[0]).toEqual({ role: 'system', content: 'S' })
    expect(body.call.abortSignal).toBeUndefined()
  })

  test.each([
    [json({ status: 'error', key: 'aiFeaturesDisabled' }, 404), 'aiFeaturesDisabled', 404],
    [json({ status: 'error', key: 'aiFeatureDisabled', params: { feature: 'x' } }, 403), 'aiFeatureDisabled', 403],
    [json({ error: 'aiFeaturesDisabled' }, 404), 'aiFeaturesDisabled', 404], // legacy body
    [new Response('{"key":"appErrors:userNotAuthorized"}', { status: 401 }), 'aiSessionExpired', 401],
    [new Response('Forbidden', { status: 403 }), 'aiNotAuthorized', 403],
    [new Response('<html>bad gateway</html>', { status: 502 }), 'aiProviderUnavailable', 502],
    [new Response('', { status: 504 }), 'aiRequestTimeout', 504],
    [new Response('', { status: 429 }), 'aiRateLimited', 429],
  ])('HTTP error case %#', async (response, key, status) => {
    const { model } = modelWith(() => response)
    const error: any = await generateText({ model, prompt: 'P', maxRetries: 0 }).catch((err) => err)
    expect(error.key).toBe(key)
    expect(error.statusCode).toBe(status)
    expect(String(error.message)).not.toMatch(/<html>|HTTP/)
  })
})

describe('gateway model: stream', () => {
  test('streams the text chunks', async () => {
    const { model, requests } = modelWith(() =>
      sse([
        { type: 'stream-start', warnings: [] },
        { type: 'text-start', id: 't' },
        { type: 'text-delta', id: 't', delta: 'Hel' },
        { type: 'text-delta', id: 't', delta: 'lo' },
        { type: 'text-end', id: 't' },
        finish,
      ])
    )
    const chunks: string[] = []
    await streamTextChunks({ model, prompt: 'P', onChunk: (chunk) => chunks.push(chunk) })
    expect(chunks.join('')).toBe('Hello')
    expect(requests[0].body.stream).toBe(true)
  })

  test('an error frame rejects with its key after the partial text', async () => {
    const { model } = modelWith(() =>
      sse([
        { type: 'stream-start', warnings: [] },
        { type: 'text-start', id: 't' },
        { type: 'text-delta', id: 't', delta: 'partial' },
        { type: 'error', error: { key: 'aiRequestTimeout', params: {} } },
      ])
    )
    const chunks: string[] = []
    const error: any = await streamTextChunks({ model, prompt: 'P', onChunk: (chunk) => chunks.push(chunk) }).catch(
      (err) => err
    )
    expect(chunks.join('')).toBe('partial')
    expect(error.key).toBe('aiRequestTimeout')
  })

  test('an HTTP error before the stream rejects with its key', async () => {
    const { model } = modelWith(() => json({ status: 'error', key: 'aiNotConfigured' }, 503))
    const error: any = await streamTextChunks({ model, prompt: 'P', onChunk: () => {} }).catch((err) => err)
    expect(error.key).toBe('aiNotConfigured')
  })

  test('aborting the caller signal aborts the signal fetch received', async () => {
    const { model, requests } = modelWith(() => sse([finish]))
    const controller = new AbortController()
    await streamTextChunks({ model, prompt: 'P', onChunk: () => {}, signal: controller.signal })
    const fetchSignal: AbortSignal = requests[0].signal
    expect(fetchSignal.aborted).toBe(false)
    controller.abort()
    expect(fetchSignal.aborted).toBe(true)
  })
})
