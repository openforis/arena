import { createNodesBatchReplyRegistry } from '@server/modules/record/service/update/nodesBatch/nodesBatchReplies'

const results = [{ index: 0, status: 'applied' as const }]

describe('nodes batch reply channel', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('a reply resolves the pending request and removes it', async () => {
    const registry = createNodesBatchReplyRegistry({ timeoutMs: 1000 })
    const promise = registry.waitFor('req-1')
    expect(registry.size()).toBe(1)
    expect(registry.resolveReply({ requestId: 'req-1', results })).toBe(true)
    await expect(promise).resolves.toEqual(results)
    expect(registry.size()).toBe(0)
    expect(jest.getTimerCount()).toBe(0)
  })

  test('no reply within the timeout resolves null and removes the entry; a late reply is ignored', async () => {
    const registry = createNodesBatchReplyRegistry({ timeoutMs: 1000 })
    const promise = registry.waitFor('req-2')
    jest.advanceTimersByTime(999)
    expect(registry.size()).toBe(1)
    jest.advanceTimersByTime(1)
    await expect(promise).resolves.toBeNull()
    expect(registry.size()).toBe(0)
    expect(registry.resolveReply({ requestId: 'req-2', results })).toBe(false)
  })

  test('a reply for an unknown request is ignored', () => {
    const registry = createNodesBatchReplyRegistry({ timeoutMs: 1000 })
    expect(registry.resolveReply({ requestId: 'nope', results })).toBe(false)
  })

  test('the default timeout is 60 seconds', async () => {
    const registry = createNodesBatchReplyRegistry()
    const promise = registry.waitFor('req-3')
    jest.advanceTimersByTime(59_999)
    expect(registry.size()).toBe(1)
    jest.advanceTimersByTime(1)
    await expect(promise).resolves.toBeNull()
  })
})
