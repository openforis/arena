import {
  deserializeGenerateResult,
  deserializeStreamPart,
  serializeGenerateResult,
  serializeStreamPart,
} from '@common/ai/wire'

const mapError = (error: any) => ({ key: error?.key ?? 'aiProviderUnavailable' })
const roundTrip = (part: any) => {
  const json = serializeStreamPart(part, mapError)
  return json === null ? null : deserializeStreamPart(JSON.parse(JSON.stringify(json)))
}

describe('stream parts on the wire', () => {
  test('text parts round-trip without provider metadata', () => {
    expect(roundTrip({ type: 'text-delta', id: 't', delta: 'Hi', providerMetadata: { x: { secret: 1 } } })).toEqual({
      type: 'text-delta',
      id: 't',
      delta: 'Hi',
    })
  })

  test('response-metadata keeps its timestamp as a Date', () => {
    const timestamp = new Date('2026-10-06T10:00:00.000Z')
    const part: any = roundTrip({ type: 'response-metadata', id: 'r1', modelId: 'm', timestamp })
    expect(part.timestamp).toEqual(timestamp)
  })

  test('finish keeps usage and finish reason', () => {
    const finish = {
      type: 'finish',
      finishReason: { unified: 'stop', raw: 'stop' },
      usage: { inputTokens: { total: 3 }, outputTokens: { total: 4 } },
    }
    expect(roundTrip(finish)).toEqual(finish)
  })

  test('error parts carry only the mapped key and become SystemErrors', () => {
    const json: any = serializeStreamPart(
      { type: 'error', error: new Error('upstream said: secret details') },
      mapError
    )
    expect(json).toEqual({ type: 'error', error: { key: 'aiProviderUnavailable' } })
    const part: any = deserializeStreamPart(json)
    expect(part.error.key).toBe('aiProviderUnavailable')
  })

  test.each(['raw', 'tool-call', 'file', 'source', 'tool-input-start'])('%s parts are not forwarded', (type) => {
    expect(serializeStreamPart({ type } as any, mapError)).toBeNull()
  })
})

describe('generate results on the wire', () => {
  test('keeps text and reasoning content, finish reason, usage, warnings and response metadata only', () => {
    const result: any = {
      content: [
        { type: 'reasoning', text: 'think' },
        { type: 'text', text: 'answer', providerMetadata: { a: 1 } },
        { type: 'tool-call', toolCallId: 'x', toolName: 'y', input: '{}' },
      ],
      finishReason: { unified: 'stop', raw: undefined },
      usage: { inputTokens: { total: 1 }, outputTokens: { total: 2 } },
      warnings: [],
      request: { body: 'secret request' },
      response: {
        id: 'r',
        modelId: 'm',
        timestamp: new Date('2026-10-06T10:00:00.000Z'),
        headers: { h: 'x' },
        body: 'raw',
      },
      providerMetadata: { p: 1 },
    }
    const back = deserializeGenerateResult(JSON.parse(JSON.stringify(serializeGenerateResult(result))))
    expect(back).toEqual({
      content: [
        { type: 'reasoning', text: 'think' },
        { type: 'text', text: 'answer' },
      ],
      finishReason: { unified: 'stop' },
      usage: { inputTokens: { total: 1 }, outputTokens: { total: 2 } },
      warnings: [],
      response: { id: 'r', modelId: 'm', timestamp: new Date('2026-10-06T10:00:00.000Z') },
    })
  })
})
