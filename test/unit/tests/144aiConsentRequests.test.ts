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

  test('a request without an alternative never shares a card that offers another engine', () => {
    const queue = createConsentRequestQueue()
    queue.request({ ...request(1), canUseOther: true })
    queue.request(request(1))
    queue.answer(queue.getPending()!.id, 'continue')
    expect(queue.getPending()).toEqual({ id: 2, ...request(1) })
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

  test('cancelAll answers every pending request with cancel and empties the queue', async () => {
    const queue = createConsentRequestQueue()
    const forOne = queue.request(request(1))
    const sharing = queue.request(request(1))
    const forTwo = queue.request(request(2))
    queue.cancelAll()
    expect(await forOne).toBe('cancel')
    expect(await sharing).toBe('cancel')
    expect(await forTwo).toBe('cancel')
    expect(queue.getPending()).toBeNull()
  })

  test('an aborted signal cancels only its caller and closes the dialog when nobody else waits', async () => {
    const queue = createConsentRequestQueue()
    const controller = new AbortController()
    const aborting = queue.request(request(1), controller.signal)
    const staying = queue.request(request(1))
    controller.abort()
    expect(await aborting).toBe('cancel')
    expect(queue.getPending()?.surveyId).toBe(1)
    queue.answer(queue.getPending()!.id, 'continue')
    expect(await staying).toBe('continue')

    const alone = new AbortController()
    const only = queue.request(request(2), alone.signal)
    alone.abort()
    expect(await only).toBe('cancel')
    expect(queue.getPending()).toBeNull()
    expect(await queue.request(request(3), alone.signal)).toBe('cancel')
    expect(queue.getPending()).toBeNull()
  })
})
