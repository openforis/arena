import { createGatewayModel } from '@webapp/ai/runtime/gatewayModel'

const encoder = new TextEncoder()

const sseOf = (frames: object[]) =>
  new Response(
    new ReadableStream({
      start(controller) {
        for (const frame of frames) controller.enqueue(encoder.encode(`data: ${JSON.stringify(frame)}\n\n`))
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    }),
    { status: 200, headers: { 'Content-Type': 'text/event-stream' } }
  )

describe('gateway model: coalesced stream (580)', () => {
  test('deltas that arrive together reach the caller as one part', async () => {
    const deltas = Array.from({ length: 20 }, (_, i) => ({ type: 'text-delta', id: 't', delta: `${i},` }))
    const model = createGatewayModel({
      feature: 'expressionGenerate',
      dataClass: 'schema',
      providerId: 'arena-default',
      fetchImpl: async () => sseOf([{ type: 'text-start', id: 't' }, ...deltas, { type: 'text-end', id: 't' }]),
    })
    const { stream } = await model.doStream({ prompt: [] })
    const reader = stream.getReader()
    const parts: any[] = []
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      parts.push(value)
    }
    const textDeltas = parts.filter((part) => part.type === 'text-delta')
    expect(textDeltas.length).toBeLessThan(deltas.length)
    expect(textDeltas.map((part) => part.delta).join('')).toBe(deltas.map((part) => part.delta).join(''))
  })
})
