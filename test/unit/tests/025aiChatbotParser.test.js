/**
 * Tests for the AI SDK v5 SSE parser used by the Vercel AI SDK provider
 * adapter.
 */
import { createV5StreamParser } from '@server/modules/ai/service/vercelAiSdkProvider'

describe('createV5StreamParser', () => {
  test('parses multiple events delivered in one push', () => {
    const events = []
    const parser = createV5StreamParser({ onEvent: (e) => events.push(e) })
    parser.push('data: {"type":"text-delta","delta":"hi"}\n\n' + 'data: {"type":"text-delta","delta":" there"}\n\n')
    parser.end()
    expect(events).toEqual([
      { type: 'text-delta', delta: 'hi' },
      { type: 'text-delta', delta: ' there' },
    ])
  })

  test('buffers events that straddle chunk boundaries', () => {
    const events = []
    const parser = createV5StreamParser({ onEvent: (e) => events.push(e) })
    parser.push('data: {"type":"text-delta","del')
    parser.push('ta":"split"}\n\n')
    parser.end()
    expect(events).toEqual([{ type: 'text-delta', delta: 'split' }])
  })

  test('ignores malformed JSON payloads without crashing', () => {
    const events = []
    const parser = createV5StreamParser({ onEvent: (e) => events.push(e) })
    parser.push('data: {"this is not valid json\n\n')
    parser.push('data: {"type":"text-delta","delta":"ok"}\n\n')
    parser.end()
    expect(events).toEqual([{ type: 'text-delta', delta: 'ok' }])
  })

  test('reports terminal [DONE] via onDone and stops processing', () => {
    const events = []
    let doneCount = 0
    const parser = createV5StreamParser({
      onEvent: (e) => events.push(e),
      onDone: () => {
        doneCount += 1
      },
    })
    parser.push(
      'data: {"type":"text-delta","delta":"before"}\n\n' +
        'data: [DONE]\n\n' +
        'data: {"type":"text-delta","delta":"after"}\n\n'
    )
    expect(events).toEqual([{ type: 'text-delta', delta: 'before' }])
    expect(doneCount).toBe(1)
    parser.end()
    expect(doneCount).toBe(1)
  })

  test('end() emits onDone exactly once even without [DONE] marker', () => {
    let doneCount = 0
    const parser = createV5StreamParser({
      onEvent: () => {},
      onDone: () => {
        doneCount += 1
      },
    })
    parser.push('data: {"type":"text-delta","delta":"only"}\n\n')
    parser.end()
    parser.end()
    expect(doneCount).toBe(1)
  })

  test('ignores non-data lines (event:, id:, comments)', () => {
    const events = []
    const parser = createV5StreamParser({ onEvent: (e) => events.push(e) })
    parser.push(': keep-alive comment\n')
    parser.push('event: message\n')
    parser.push('id: 42\n')
    parser.push('data: {"type":"text-delta","delta":"hi"}\n\n')
    parser.end()
    expect(events).toEqual([{ type: 'text-delta', delta: 'hi' }])
  })

  test('forwards reasoning-delta events distinctly from text-delta', () => {
    const events = []
    const parser = createV5StreamParser({ onEvent: (e) => events.push(e) })
    parser.push('data: {"type":"reasoning-delta","delta":"thinking"}\n\n')
    parser.push('data: {"type":"text-delta","delta":"answer"}\n\n')
    parser.end()
    expect(events.map((e) => e.type)).toEqual(['reasoning-delta', 'text-delta'])
  })
})
