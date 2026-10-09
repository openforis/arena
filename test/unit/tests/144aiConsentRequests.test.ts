import { createConsentRequestQueue } from '@webapp/ai/engines/consentRequests'

const request = (surveyId?: number, baseUrl = 'http://localhost:1234/v1') => ({
  surveyId,
  baseUrl,
  modelId: 'local-model',
  hostingClass: 'onDevice' as const,
  canUseOther: false,
})

describe('consent request queue', () => {
  test('one dialog for concurrent requests of the same survey and server; one answer for all', async () => {
    const queue = createConsentRequestQueue()
    const first = queue.request(request(1))
    const second = queue.request(request(1))
    const pending = queue.getPending()
    expect(pending).toEqual({ id: 1, ...request(1) })
    queue.answer(pending!.id, 'continue')
    expect(await first).toBe('continue')
    expect(await second).toBe('continue')
    expect(queue.getPending()).toBeNull()
  })

  test('requests for other surveys wait for their turn', async () => {
    const queue = createConsentRequestQueue()
    const forOne = queue.request(request(1))
    const forTwo = queue.request(request(2))
    expect(queue.getPending()?.surveyId).toBe(1)
    queue.answer(queue.getPending()!.id, 'cancel')
    expect(await forOne).toBe('cancel')
    expect(queue.getPending()?.surveyId).toBe(2)
    queue.answer(queue.getPending()!.id, 'useOther')
    expect(await forTwo).toBe('useOther')
  })

  test('another server URL is another request', () => {
    const queue = createConsentRequestQueue()
    queue.request(request(1))
    queue.request(request(1, 'http://localhost:1235/v1'))
    queue.answer(queue.getPending()!.id, 'continue')
    expect(queue.getPending()?.baseUrl).toBe('http://localhost:1235/v1')
  })

  test('subscribers are notified; the pending snapshot is stable between changes', () => {
    const queue = createConsentRequestQueue()
    let calls = 0
    const unsubscribe = queue.subscribe(() => {
      calls += 1
    })
    queue.request(request(1))
    expect(queue.getPending()).toBe(queue.getPending())
    queue.answer(queue.getPending()!.id, 'continue')
    expect(calls).toBe(2)
    unsubscribe()
    queue.request(request(2))
    expect(calls).toBe(2)
  })

  test('an unknown or already answered id is ignored', async () => {
    const queue = createConsentRequestQueue()
    const answer = queue.request(request(1))
    const { id } = queue.getPending()!
    queue.answer(99, 'cancel')
    queue.answer(id, 'continue')
    queue.answer(id, 'cancel')
    expect(await answer).toBe('continue')
  })
})
