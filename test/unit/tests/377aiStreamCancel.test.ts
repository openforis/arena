import type { LanguageModelV4StreamPart } from '@ai-sdk/provider'

import { createDeltaCoalescer } from '@webapp/ai/engines/coalesceDeltas'
import { readSseParts } from '@webapp/ai/runtime/sseReader'

/** Returns a manual clock that counts the timers still scheduled. */
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
  }
}

const text = (delta: string): LanguageModelV4StreamPart => ({ type: 'text-delta', id: 't1', delta })

describe('the delta coalescer when the stream is stopped (377)', () => {
  test('a stopped reader clears the timer and drops the waiting text', async () => {
    const clock = manualTimers()
    const { readable, writable } = createDeltaCoalescer({ timers: clock.timers })
    const reader = readable.getReader()
    const writer = writable.getWriter()
    const firstRead = reader.read()
    await writer.write(text('Hel'))
    expect(clock.pendingCount()).toBe(1)
    await reader.cancel('stop')
    expect(clock.pendingCount()).toBe(0)
    await firstRead
  })

  test('an upstream abort clears the timer too', async () => {
    const clock = manualTimers()
    const { readable, writable } = createDeltaCoalescer({ timers: clock.timers })
    const reader = readable.getReader()
    const writer = writable.getWriter()
    const firstRead = reader.read().catch(() => undefined)
    await writer.write(text('Hel'))
    expect(clock.pendingCount()).toBe(1)
    await writer.abort(new Error('upstream failed'))
    expect(clock.pendingCount()).toBe(0)
    await firstRead
  })
})

describe('readSseParts: a malformed part stops the gateway call (377)', () => {
  test('the HTTP body is cancelled with the error', async () => {
    const state = { cancelled: false, reason: null as unknown }
    const encoder = new TextEncoder()
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"type":"text-delta","id":"t","delta":"Hi"}\n\n'))
        controller.enqueue(encoder.encode('data: {"nothing":1}\n\n'))
        // never closes: the gateway call keeps running until it is cancelled
      },
      cancel(reason) {
        state.cancelled = true
        state.reason = reason
      },
    })
    const reader = readSseParts(new Response(body, { status: 200 })).getReader()
    expect(((await reader.read()).value as any).delta).toBe('Hi')
    const error = await reader.read().catch((e) => e)
    expect(error.key).toBe('aiProviderUnavailable')
    expect(state.cancelled).toBe(true)
    expect((state.reason as any).key).toBe('aiProviderUnavailable')
  })
})
