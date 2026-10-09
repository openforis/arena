import { generateText, streamText } from 'ai'

import { createVercelAiSdkModel } from '@server/modules/ai/service/vercelAiSdkProvider'

const encoder = new TextEncoder()

const sseResponse = (frames: string[]) =>
  new Response(
    new ReadableStream({
      start(controller) {
        for (const frame of frames) controller.enqueue(encoder.encode(frame))
        controller.close()
      },
    }),
    { status: 200, headers: { 'Content-Type': 'text/event-stream' } }
  )

const readPartTypes = async (stream: ReadableStream<any>): Promise<string[]> => {
  const types: string[] = []
  const reader = stream.getReader()
  for (let result = await reader.read(); !result.done; result = await reader.read()) types.push(result.value.type)
  return types
}

const frames = [
  'data: {"type":"start"}\n\n',
  'data: {"type":"text-delta","delta":"Hel"}\n\n',
  'data: {"type":"reasoning-delta","delta":"hmm"}\n\n',
  'data: {"type":"text-delta","delta":"lo"}\n\n',
  'data: [DONE]\n\n',
]

describe('vercel-ai-sdk provider (LanguageModelV4)', () => {
  test('declares v4 and generates text through generateText', async () => {
    const calls = []
    const fetchImpl = async (url, init) => {
      calls.push({ url, body: JSON.parse(init.body), redirect: init.redirect })
      return sseResponse(frames)
    }
    const model = createVercelAiSdkModel({ baseUrl: 'https://agent.example/chat', fetchImpl })
    expect(model.specificationVersion).toBe('v4')

    const result = await generateText({ model, system: 'Be brief.', prompt: 'Hi' })
    expect(result.text).toBe('Hello')
    expect(result.finishReason).toBe('stop')
    expect(calls[0].redirect).toBe('error')
    expect(calls[0].body.messages).toEqual([{ role: 'user', parts: [{ type: 'text', text: 'Be brief.\n\nHi' }] }])
  })

  test('streams text deltas through streamText', async () => {
    const model = createVercelAiSdkModel({
      baseUrl: 'https://agent.example/chat',
      fetchImpl: async () => sseResponse(frames),
    })
    const chunks = []
    for await (const chunk of streamText({ model, prompt: 'Hi' }).textStream) chunks.push(chunk)
    expect(chunks.join('')).toBe('Hello')
  })

  test('an upstream error event fails the generation with its text', async () => {
    const model = createVercelAiSdkModel({
      baseUrl: 'https://agent.example/chat',
      fetchImpl: async () => sseResponse(['data: {"type":"error","errorText":"agent down"}\n\n']),
    })
    await expect(generateText({ model, prompt: 'Hi', maxRetries: 0 })).rejects.toThrow('agent down')
  })

  test('an HTTP error fails with the status', async () => {
    const model = createVercelAiSdkModel({
      baseUrl: 'https://agent.example/chat',
      fetchImpl: async () => new Response('nope', { status: 500 }),
    })
    await expect(generateText({ model, prompt: 'Hi', maxRetries: 0 })).rejects.toThrow(/HTTP 500/)
  })

  test('cancelling the stream aborts the upstream request', async () => {
    let upstreamSignal: AbortSignal
    const fetchImpl = async (_url, init) => {
      upstreamSignal = init.signal
      return new Response(new ReadableStream({ start() {} }), { status: 200 }) // never ends
    }
    const model = createVercelAiSdkModel({ baseUrl: 'https://agent.example/chat', fetchImpl })
    const { stream } = await model.doStream({ prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hi' }] }] })
    const reader = stream.getReader()
    await reader.read() // stream-start
    await reader.cancel()
    expect(upstreamSignal.aborted).toBe(true)
  })

  test('an upstream error event aborts the upstream request', async () => {
    let upstreamSignal: AbortSignal
    const fetchImpl = async (_url, init) => {
      upstreamSignal = init.signal
      return sseResponse(['data: {"type":"error","errorText":"agent down"}\n\n'])
    }
    const model = createVercelAiSdkModel({ baseUrl: 'https://agent.example/chat', fetchImpl })
    await expect(generateText({ model, prompt: 'Hi', maxRetries: 0 })).rejects.toThrow('agent down')
    expect(upstreamSignal.aborted).toBe(true)
  })

  test('a timeout fails generation instead of returning a truncated answer', async () => {
    const fetchImpl = async () => new Response(new ReadableStream({ start() {} }), { status: 200 })
    const model = createVercelAiSdkModel({ baseUrl: 'https://agent.example/chat', timeoutMs: 20, fetchImpl })
    await expect(generateText({ model, prompt: 'Hi', maxRetries: 0 })).rejects.toThrow()
  })

  test('generation fails when the upstream closes without [DONE]', async () => {
    const model = createVercelAiSdkModel({
      baseUrl: 'https://agent.example/chat',
      fetchImpl: async () => sseResponse(['data: {"type":"text-delta","delta":"Hel"}\n\n']),
    })
    await expect(generateText({ model, prompt: 'Hi', maxRetries: 0 })).rejects.toThrow()
  })

  test('a stream closed without [DONE] ends with an error part and no finish', async () => {
    const model = createVercelAiSdkModel({
      baseUrl: 'https://agent.example/chat',
      fetchImpl: async () => sseResponse(['data: {"type":"text-delta","delta":"Hel"}\n\n']),
    })
    const { stream } = await model.doStream({ prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hi' }] }] })
    const types = await readPartTypes(stream)
    expect(types).toContain('error')
    expect(types).not.toContain('finish')
  })

  test('an error event in a stream is not followed by a finish part', async () => {
    const model = createVercelAiSdkModel({
      baseUrl: 'https://agent.example/chat',
      fetchImpl: async () => sseResponse(['data: {"type":"error","errorText":"agent down"}\n\n', 'data: [DONE]\n\n']),
    })
    const { stream } = await model.doStream({ prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hi' }] }] })
    const types = await readPartTypes(stream)
    expect(types).toContain('error')
    expect(types).not.toContain('finish')
  })

  test('a complete stream still ends with finish', async () => {
    const model = createVercelAiSdkModel({
      baseUrl: 'https://agent.example/chat',
      fetchImpl: async () => sseResponse(frames),
    })
    const { stream } = await model.doStream({ prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hi' }] }] })
    const types = await readPartTypes(stream)
    expect(types[types.length - 1]).toBe('finish')
    expect(types).not.toContain('error')
  })
})
