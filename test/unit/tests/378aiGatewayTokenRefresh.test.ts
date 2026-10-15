// The gateway fetch refreshes the auth token through the app's single-flight refresh (shared with the axios
// interceptor): concurrent 401s must not rotate the refresh token in parallel.
const captured: { deps: any } = { deps: null }

jest.mock('@webapp/ai/runtime/authorizedFetch', () => ({
  createAuthorizedFetch: (deps: unknown) => {
    captured.deps = deps
    return jest.fn()
  },
}))

jest.mock('axios', () => {
  const post = jest.fn()
  const instance = {
    post,
    request: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  }
  return { __esModule: true, default: { ...instance, create: () => instance }, post }
})

describe('getModel wires the single-flight token refresh (378)', () => {
  test('concurrent refreshes of the gateway fetch share one request to the server', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const axios = require('axios')
    let respond!: (value: unknown) => void
    axios.default.post.mockImplementation(() => new Promise((resolve) => (respond = resolve)))
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@webapp/ai/runtime/getModel')

    const first = captured.deps.refreshAuthToken()
    const second = captured.deps.refreshAuthToken()
    respond({ data: { authToken: 'new-token' } })
    expect(await first).toBe('new-token')
    expect(await second).toBe('new-token')
    expect(axios.default.post).toHaveBeenCalledTimes(1)
  })
})
