import { buildCurrentUserGroupBody } from '@server/modules/user/api/currentUserGroupBody'
import { stripServerOnlyPrefsFromLoginResponse } from '@server/modules/auth/authResponseMiddleware'
import { createFakeResponse } from '@test/unit/utils/fakeExpress'

const user = {
  uuid: 'u1',
  prefs: { language: 'en', ai: { providers: [{ apiKeyEncrypted: 'v2:secret' }] }, aiUsage: { calls: 2 } },
}

describe('Server-only prefs on the user routes (311)', () => {
  test('the body of current-user-group has no AI prefs and keeps the user group', () => {
    const userGroup = { uuid: 'g1', name: 'admins' }
    const body = buildCurrentUserGroupBody({ user, userGroup })
    expect(body).toEqual({ user: { uuid: 'u1', prefs: { language: 'en' } }, userGroup })
    expect(JSON.stringify(body)).not.toMatch(/secret|aiUsage/)
    // the user of the request keeps its prefs: the AI gates read them
    expect(user.prefs.ai).toBeDefined()
  })

  test.each(['/auth/login', '/AUTH/LOGIN', '/Auth/Login/', '/auth/login/temp', '/Auth/LOGIN/Temp/'])(
    'the user of the login response at %s is sent without the AI prefs',
    (path) => {
      const res: any = createFakeResponse()
      const next = jest.fn()
      stripServerOnlyPrefsFromLoginResponse({ path } as any, res, next)
      res.json({ user })
      expect(next).toHaveBeenCalledTimes(1)
      expect(JSON.stringify(res.body)).not.toMatch(/secret|aiUsage/)
    }
  )

  test('other paths are not touched', () => {
    const res: any = createFakeResponse()
    const json = res.json
    stripServerOnlyPrefsFromLoginResponse({ path: '/auth/loginx' } as any, res, jest.fn())
    expect(res.json).toBe(json)
  })
})
