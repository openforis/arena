// The gateway fetch refreshes the auth token through the app's single-flight refresh (shared with the axios
// interceptor): concurrent 401s must not rotate the refresh token in parallel.
// No jest.mock: it has no effect in the bundled run, so the test spies on the real axios (an external module).
import axios from 'axios'

import { refreshGatewayAuthToken } from '@webapp/ai/runtime/getModel'

describe('getModel wires the single-flight token refresh (378)', () => {
  afterEach(() => jest.restoreAllMocks())

  test('concurrent refreshes of the gateway fetch share one request to the server', async () => {
    let respond!: (value: unknown) => void
    const post = jest
      .spyOn(axios, 'post')
      .mockImplementation(() => new Promise((resolve) => (respond = resolve)) as ReturnType<typeof axios.post>)

    const first = refreshGatewayAuthToken()
    const second = refreshGatewayAuthToken()
    respond({ data: { authToken: 'new-token' } })
    expect(await first).toBe('new-token')
    expect(await second).toBe('new-token')
    expect(post).toHaveBeenCalledTimes(1)
  })
})
