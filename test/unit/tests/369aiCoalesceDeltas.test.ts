import type { LanguageModelV4StreamPart } from '@ai-sdk/provider'

import { createDeltaCoalescer } from '@webapp/ai/engines/coalesceDeltas'

type Part = LanguageModelV4StreamPart

const text = (delta: string, id = 't1'): Part => ({ type: 'text-delta', id, delta })
const reasoning = (delta: string, id = 'r1'): Part => ({ type: 'reasoning-delta', id, delta })

/** Returns a manual clock: timers run only when the test says so. */
const manualTimers = () => {
  const callbacks = new Map<number, () => void>()
  let next = 1
  return {
    timers: {
      setTimer: (callback: () => void) => {
        callbacks.set(next, callback)
        return next++
      },
      clearTimer: (timer: unknown) => void callbacks.delete(timer as number),
    },
    pendingCount: () => callbacks.size,
    fire: () => {
      const [id, callback] = [...callbacks.entries()][0] ?? []
      if (id === undefined || !callback) return
      callbacks.delete(id)
      callback()
    },
  }
}

/** Runs the parts through the coalescer; `between` runs after the part at that index was written. */
const run = async (parts: Part[], clock = manualTimers(), between: Record<number, () => void> = {}) => {
  const { readable, writable } = createDeltaCoalescer({ timers: clock.timers })
  const output: Part[] = []
  const reading = (async () => {
    const reader = readable.getReader()
    for (;;) {
      const { value, done } = await reader.read()
      if (done) return
      output.push(value)
    }
  })()
  const writer = writable.getWriter()
  for (const [index, part] of parts.entries()) {
    await writer.write(part)
    between[index]?.()
    // let the reader see what was enqueued
    await new Promise((resolve) => setImmediate(resolve))
  }
  await writer.close()
  await reading
  return output
}

describe('createDeltaCoalescer (369)', () => {
  test('deltas of one block that arrive together become one part', async () => {
    const output = await run([text('Hel'), text('lo '), text('world')])
    expect(output).toEqual([text('Hello world')])
  })

  test('the delta that is waiting is sent when its interval ends, not at the end of the stream', async () => {
    const clock = manualTimers()
    const seen: string[] = []
    const output = await run([text('a'), text('b'), text('c')], clock, {
      1: () => clock.fire(),
      2: () => seen.push('after c'),
    })
    // "ab" went out on the timer; "c" waited for the end of the stream
    expect(output).toEqual([text('ab'), text('c')])
    expect(seen).toEqual(['after c'])
  })

  test('other parts go at once, after the delta before them, in order', async () => {
    const start: Part = { type: 'text-start', id: 't1' }
    const end: Part = { type: 'text-end', id: 't1' }
    const finish: Part = {
      type: 'finish',
      usage: { inputTokens: { total: 1 }, outputTokens: { total: 2 } } as never,
      finishReason: { unified: 'stop' } as never,
    }
    const output = await run([start, text('a'), text('b'), end, finish])
    expect(output).toEqual([start, text('ab'), end, finish])
  })

  test('text and reasoning are never merged together, nor are two blocks', async () => {
    const output = await run([reasoning('think'), reasoning('ing'), text('answer'), text(' 1'), text('x', 't2')])
    expect(output).toEqual([reasoning('thinking'), text('answer 1'), text('x', 't2')])
  })

  test('a delta with provider metadata is passed on as it is', async () => {
    const withMetadata: Part = { type: 'text-delta', id: 't1', delta: 'b', providerMetadata: { p: { k: 1 } } }
    const output = await run([text('a'), withMetadata, text('c')])
    expect(output).toEqual([text('a'), withMetadata, text('c')])
  })

  test('no timer is left running at the end of the stream', async () => {
    const clock = manualTimers()
    await run([text('a'), text('b')], clock)
    expect(clock.pendingCount()).toBe(0)
  })

  test('a timer that fires after the reader cancelled does not throw', async () => {
    const clock = manualTimers()
    const { readable, writable } = createDeltaCoalescer({ timers: clock.timers })
    const writer = writable.getWriter()
    const reader = readable.getReader()
    // a transform runs while the reader asks for a part
    const firstRead = reader.read()
    await writer.write(text('a'))
    await reader.cancel('stopped')
    await firstRead
    expect(() => clock.fire()).not.toThrow()
  })

  test('with the real timers a slow stream still delivers its first delta soon', async () => {
    const { readable, writable } = createDeltaCoalescer({ intervalMs: 10 })
    const writer = writable.getWriter()
    const reader = readable.getReader()
    const firstRead = reader.read()
    await writer.write(text('first'))
    // nothing else is written: only the timer can deliver it
    const { value } = await firstRead
    expect(value).toEqual(text('first'))
    await writer.close()
  })
})
