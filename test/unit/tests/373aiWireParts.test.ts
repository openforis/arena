import { deserializeGenerateResult, deserializeStreamPart } from '@common/ai/wire'
import { readSseParts } from '@webapp/ai/runtime/sseReader'

/** Returns the error a call throws (null when it does not). */
const thrown = (call: () => unknown): any => {
  try {
    call()
  } catch (error) {
    return error
  }
  return null
}

/** Returns an SSE response with these JSON events. */
const sseResponse = (events: string[]): Response =>
  new Response(events.map((event) => `data: ${event}\n\n`).join(''), { status: 200 })

describe('deserializeStreamPart: what comes off the wire is checked, not trusted (373)', () => {
  test.each([[null], [undefined], ['text'], [42], [[]], [{}], [{ type: 7 }]])('%j is not a stream part', (json) => {
    const error = thrown(() => deserializeStreamPart(json))
    expect(error?.key).toBe('aiProviderUnavailable')
    expect(error?.statusCode).toBe(502)
  })

  test('a text part is returned as it is', () => {
    const part = { type: 'text-delta', id: 't', delta: 'Hi' }
    expect(deserializeStreamPart(part)).toEqual(part)
  })

  test('response-metadata gets its timestamp back as a Date', () => {
    const part: any = deserializeStreamPart({
      type: 'response-metadata',
      id: 'r',
      timestamp: '2026-10-06T10:00:00.000Z',
    })
    expect(part.timestamp).toEqual(new Date('2026-10-06T10:00:00.000Z'))
  })

  test('an error part becomes a SystemError with its key and params, or the provider error without them', () => {
    const mapped: any = deserializeStreamPart({ type: 'error', error: { key: 'aiBudgetExceeded', params: { a: 1 } } })
    expect(mapped.error.key).toBe('aiBudgetExceeded')
    expect(mapped.error.params).toEqual({ a: 1 })
    const bare: any = deserializeStreamPart({ type: 'error' })
    expect(bare.error.key).toBe('aiProviderUnavailable')
  })
})

describe('deserializeGenerateResult (373)', () => {
  test('a result that is not an object is refused', () => {
    expect(thrown(() => deserializeGenerateResult(null))?.key).toBe('aiProviderUnavailable')
    expect(thrown(() => deserializeGenerateResult('x'))?.key).toBe('aiProviderUnavailable')
  })

  test('the response timestamp is a Date again, the rest is kept', () => {
    const result = deserializeGenerateResult({
      content: [{ type: 'text', text: 'a' }],
      finishReason: { unified: 'stop', raw: 'stop' },
      usage: {},
      warnings: [],
      response: { id: 'r', timestamp: '2026-10-06T10:00:00.000Z' },
    })
    expect(result.response?.timestamp).toEqual(new Date('2026-10-06T10:00:00.000Z'))
    expect(result.content).toEqual([{ type: 'text', text: 'a' }])
  })

  test('a result without a response keeps none', () => {
    expect(deserializeGenerateResult({ content: [] }).response).toBeUndefined()
  })
})

describe('readSseParts: a malformed part ends the stream with an error (373)', () => {
  test('the parts before it are delivered and the stream then errors', async () => {
    const reader = readSseParts(
      sseResponse(['{"type":"text-delta","id":"t","delta":"Hi"}', '{"nothing":1}'])
    ).getReader()
    expect(((await reader.read()).value as any).delta).toBe('Hi')
    const error = await reader.read().catch((e) => e)
    expect(error.key).toBe('aiProviderUnavailable')
  })

  test('well-formed parts end with a normal close', async () => {
    const reader = readSseParts(sseResponse(['{"type":"text-delta","id":"t","delta":"Hi"}'])).getReader()
    expect((await reader.read()).done).toBe(false)
    expect((await reader.read()).done).toBe(true)
  })
})
