import { createAuthorizedFetch } from '@webapp/ai/runtime/authorizedFetch'

const recorder = (statuses: number[]) => {
  const calls: { url: string; init: RequestInit }[] = []
  const fetchImpl = async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    return new Response('{}', { status: statuses[calls.length - 1] ?? 200 })
  }
  return { calls, fetchImpl }
}

const authHeader = (init: RequestInit) => new Headers(init.headers).get('Authorization')

describe('createAuthorizedFetch', () => {
  test('adds the bearer token and same-origin credentials', async () => {
    const { calls, fetchImpl } = recorder([200])
    const authorizedFetch = createAuthorizedFetch({
      fetchImpl,
      getAuthToken: () => 't1',
      refreshAuthToken: async () => null,
    })
    await authorizedFetch('/api/ai/model', { method: 'POST' })
    expect(authHeader(calls[0].init)).toBe('Bearer t1')
    expect(calls[0].init.credentials).toBe('same-origin')
  })

  test('on 401 refreshes the token once and retries once', async () => {
    const { calls, fetchImpl } = recorder([401, 200])
    let token = 'old'
    const authorizedFetch = createAuthorizedFetch({
      fetchImpl,
      getAuthToken: () => token,
      refreshAuthToken: async () => {
        token = 'new'
        return token
      },
    })
    const response = await authorizedFetch('/api/ai/model', { method: 'POST' })
    expect(response.status).toBe(200)
    expect(calls.map((call) => authHeader(call.init))).toEqual(['Bearer old', 'Bearer new'])
  })

  test('a 401 after the refresh is returned as is (no loop)', async () => {
    const { calls, fetchImpl } = recorder([401, 401])
    const authorizedFetch = createAuthorizedFetch({
      fetchImpl,
      getAuthToken: () => 't',
      refreshAuthToken: async () => 't2',
    })
    expect((await authorizedFetch('/x', {})).status).toBe(401)
    expect(calls).toHaveLength(2)
  })

  test('a failed refresh returns the 401', async () => {
    const { calls, fetchImpl } = recorder([401])
    const authorizedFetch = createAuthorizedFetch({
      fetchImpl,
      getAuthToken: () => 't',
      refreshAuthToken: async () => null,
    })
    expect((await authorizedFetch('/x', {})).status).toBe(401)
    expect(calls).toHaveLength(1)
  })

  test('concurrent 401s share one refresh', async () => {
    const { fetchImpl } = recorder([401, 401, 200, 200])
    let refreshes = 0
    const authorizedFetch = createAuthorizedFetch({
      fetchImpl,
      getAuthToken: () => 't',
      refreshAuthToken: async () => {
        refreshes += 1
        await new Promise((resolve) => setTimeout(resolve, 10))
        return 't2'
      },
    })
    await Promise.all([authorizedFetch('/a', {}), authorizedFetch('/b', {})])
    expect(refreshes).toBe(1)
  })
})
