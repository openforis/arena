import { createAuthorizedFetch } from '@webapp/ai/runtime/authorizedFetch'
import { readSseParts } from '@webapp/ai/runtime/sseReader'

/** Returns a response whose body records when it is cancelled (released without being read). */
const trackedResponse = (status: number) => {
  const state = { cancelled: false }
  const body = new ReadableStream({
    cancel() {
      state.cancelled = true
    },
  })
  return { state, response: new Response(body, { status }) }
}

describe('readSseParts: a response without a body (365)', () => {
  test('fails with a provider error instead of a TypeError', () => {
    let error: any = null
    try {
      readSseParts(new Response(null, { status: 200 }))
    } catch (thrown) {
      error = thrown
    }
    expect(error?.key).toBe('aiProviderUnavailable')
    expect(error?.statusCode).toBe(502)
  })
})

describe('createAuthorizedFetch (365)', () => {
  test('the first 401 body is released when the request is retried with the new token', async () => {
    const first = trackedResponse(401)
    const responses = [first.response, new Response('{}', { status: 200 })]
    const authorizedFetch = createAuthorizedFetch({
      fetchImpl: async () => responses.shift() as Response,
      getAuthToken: () => 'old',
      refreshAuthToken: async () => 'new',
    })
    expect((await authorizedFetch('/x', {})).status).toBe(200)
    expect(first.state.cancelled).toBe(true)
  })

  test('a 401 that is returned (the refresh failed) keeps its body for the caller', async () => {
    const first = trackedResponse(401)
    const authorizedFetch = createAuthorizedFetch({
      fetchImpl: async () => first.response,
      getAuthToken: () => 'old',
      refreshAuthToken: async () => null,
    })
    const response = await authorizedFetch('/x', {})
    expect(response.status).toBe(401)
    expect(first.state.cancelled).toBe(false)
  })

  test("the refresh is the dependency's to share: every 401 asks for it", async () => {
    let refreshes = 0
    const statuses = [401, 401, 200, 200]
    const authorizedFetch = createAuthorizedFetch({
      fetchImpl: async () => new Response('{}', { status: statuses.shift() }),
      getAuthToken: () => 't',
      refreshAuthToken: async () => {
        refreshes += 1
        return 't2'
      },
    })
    await Promise.all([authorizedFetch('/a', {}), authorizedFetch('/b', {})])
    // the app's refreshAuthToken is already single-flight (appErrorsMiddleware): this module adds no second one
    expect(refreshes).toBe(2)
  })

  test('a refresh that throws returns the 401', async () => {
    const authorizedFetch = createAuthorizedFetch({
      fetchImpl: async () => new Response('{}', { status: 401 }),
      getAuthToken: () => 't',
      refreshAuthToken: async () => {
        throw new Error('network')
      },
    })
    expect((await authorizedFetch('/x', {})).status).toBe(401)
  })
})
