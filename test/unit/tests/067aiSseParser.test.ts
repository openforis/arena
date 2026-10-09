import { createSseParser } from '@common/ai/sseParser'

const collect = () => {
  const events: unknown[] = []
  let doneCount = 0
  const parser = createSseParser({ onEvent: (event) => events.push(event), onDone: () => (doneCount += 1) })
  return { parser, events, doneCount: () => doneCount }
}

describe('createSseParser', () => {
  test('parses frames split across chunks, with several data lines', () => {
    const { parser, events } = collect()
    parser.push('data: {"a":1}\n')
    parser.push('data: {"b":2}\n\nda')
    parser.push('ta: {"c":3}\n\n')
    expect(events).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }])
  })

  test('stops at [DONE] and calls onDone once', () => {
    const { parser, events, doneCount } = collect()
    parser.push('data: {"a":1}\n\ndata: [DONE]\n\ndata: {"late":true}\n\n')
    parser.end()
    expect(events).toEqual([{ a: 1 }])
    expect(doneCount()).toBe(1)
  })

  test('end() flushes a trailing frame without delimiter and calls onDone', () => {
    const { parser, events, doneCount } = collect()
    parser.push('data: {"a":1}')
    parser.end()
    expect(events).toEqual([{ a: 1 }])
    expect(doneCount()).toBe(1)
  })

  test('skips non-JSON payloads and non-data lines', () => {
    const { parser, events } = collect()
    parser.push(': comment\nevent: x\ndata: not json\n\ndata: {"ok":true}\n\n')
    expect(events).toEqual([{ ok: true }])
  })

  test('propagates errors thrown by onEvent', () => {
    const parser = createSseParser({
      onEvent: () => {
        throw new Error('boom')
      },
    })
    expect(() => parser.push('data: {"a":1}\n\n')).toThrow('boom')
  })
})
