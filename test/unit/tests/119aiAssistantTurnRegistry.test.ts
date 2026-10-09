import { createAssistantTurnRegistry, RESET_REASON } from '@webapp/components/ai/Assistant/assistantTurnRegistry'

describe('assistant turn registry', () => {
  test('abortAll aborts the registered turns with the reset reason and bumps the generation', () => {
    const registry = createAssistantTurnRegistry()
    const running = new AbortController()
    const finished = new AbortController()
    registry.register(running)
    registry.register(finished)
    registry.unregister(finished)
    const before = registry.getGeneration()
    registry.abortAll()
    expect(running.signal.aborted).toBe(true)
    expect(running.signal.reason).toBe(RESET_REASON)
    expect(finished.signal.aborted).toBe(false)
    expect(registry.getGeneration()).toBe(before + 1)
  })

  test('settle waits for the tracked saves, including ones added meanwhile', async () => {
    const registry = createAssistantTurnRegistry()
    const done: string[] = []
    let releaseFirst: () => void = () => undefined
    registry.track(
      new Promise<void>((resolve) => {
        releaseFirst = resolve
      }).then(() => {
        done.push('first')
        registry.track(Promise.resolve().then(() => done.push('second')))
      })
    )
    const settled = registry.settle().then(() => done.push('settled'))
    releaseFirst()
    await settled
    expect(done).toEqual(['first', 'second', 'settled'])
  })

  test('a failing save does not break settle and still rejects to its caller', async () => {
    const registry = createAssistantTurnRegistry()
    const failing = registry.track(Promise.reject(new Error('boom')))
    await expect(failing).rejects.toThrow('boom')
    await expect(registry.settle()).resolves.toBeUndefined()
  })
})
