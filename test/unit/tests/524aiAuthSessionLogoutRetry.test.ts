import { createAuthSession, LOGOUT_RETRY_DELAY_MS, logoutRequestConfig } from '@webapp/store/login/authSession'

describe('auth session: the logout retry (524)', () => {
  test('the retry waits before it asks again', async () => {
    const calls: string[] = []
    let attempts = 0
    const session = createAuthSession({
      requestLogout: async () => {
        attempts += 1
        calls.push(`request ${attempts}`)
        if (attempts === 1) throw new Error('Network Error')
      },
      setAuthToken: () => undefined,
      resetAiSession: async () => undefined,
      log: jest.fn(),
      wait: async (ms) => void calls.push(`wait ${ms}`),
    })
    await expect(session.end()).resolves.toEqual({ serverSessionEnded: true })
    expect(calls).toEqual(['request 1', `wait ${LOGOUT_RETRY_DELAY_MS}`, 'request 2'])
    expect(LOGOUT_RETRY_DELAY_MS).toBe(500)
  })

  test('a logout that works the first time does not wait', async () => {
    const wait = jest.fn(async () => undefined)
    const session = createAuthSession({
      requestLogout: async () => undefined,
      setAuthToken: () => undefined,
      resetAiSession: async () => undefined,
      log: jest.fn(),
      wait,
    })
    await session.end()
    expect(wait).not.toHaveBeenCalled()
  })

  test('the logout request is marked so the global error toast skips it', () => {
    expect(logoutRequestConfig).toEqual({ errorHandledLocally: true })
  })
})
