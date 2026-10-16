import { createAssistantTurnRegistry, SETTLE_TIMEOUT_MS } from '@webapp/components/ai/Assistant/assistantTurnRegistry'

describe('assistant turn registry: settle is bounded (522)', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  test('a save that never ends does not hold settle past the timeout, and the timeout is logged', async () => {
    const log = jest.fn()
    const registry = createAssistantTurnRegistry({ log })
    registry.track(new Promise<void>(() => undefined))
    let settled = false
    void registry.settle().then(() => {
      settled = true
    })
    await jest.advanceTimersByTimeAsync(SETTLE_TIMEOUT_MS - 1)
    expect(settled).toBe(false)
    expect(log).not.toHaveBeenCalled()
    await jest.advanceTimersByTimeAsync(1)
    expect(settled).toBe(true)
    expect(log).toHaveBeenCalledTimes(1)
  })

  test('saves that end in time settle without a log and leave no timer behind', async () => {
    const log = jest.fn()
    const registry = createAssistantTurnRegistry({ log })
    registry.track(Promise.resolve())
    await registry.settle()
    expect(log).not.toHaveBeenCalled()
    expect(jest.getTimerCount()).toBe(0)
  })

  test('nothing pending settles at once', async () => {
    const registry = createAssistantTurnRegistry({ log: jest.fn() })
    await expect(registry.settle()).resolves.toBeUndefined()
    expect(jest.getTimerCount()).toBe(0)
  })

  test('the timeout is about ten seconds', () => {
    expect(SETTLE_TIMEOUT_MS).toBe(10_000)
  })
})
