import {
  omitServerOnlyPrefs,
  omitServerOnlyPrefsFromUser,
  SERVER_ONLY_PREFS_KEYS,
  sqlPrefsParamWithoutServerOnlyKeys,
  sqlPrefsWithoutServerOnlyKeys,
} from '@server/modules/user/serverOnlyPrefs'
import {
  omitServerOnlyPrefsFromLoginBody,
  stripServerOnlyPrefsFromLoginResponse,
} from '@server/modules/auth/authResponseMiddleware'
import { createFakeResponse } from '@test/unit/utils/fakeExpress'

const prefs = {
  language: 'en',
  surveys: { current: 3 },
  ai: { providers: [{ id: 'acct:a', apiKeyEncrypted: 'v2:secret' }] },
  aiUsage: { day: '2026-10-15', calls: 4, chars: 100 },
}

describe('Server-only user prefs (300)', () => {
  test('the server-only keys are the AI prefs and the AI usage', () => {
    expect([...SERVER_ONLY_PREFS_KEYS]).toEqual(['ai', 'aiUsage'])
  })

  test('omitServerOnlyPrefs drops both keys, keeps the others and does not change its input', () => {
    expect(omitServerOnlyPrefs(prefs)).toEqual({ language: 'en', surveys: { current: 3 } })
    expect(prefs.ai).toBeDefined()
    expect(prefs.aiUsage).toBeDefined()
  })

  test('omitServerOnlyPrefs returns what is not an object as it is', () => {
    expect(omitServerOnlyPrefs(null)).toBeNull()
    expect(omitServerOnlyPrefs(undefined)).toBeUndefined()
    expect(omitServerOnlyPrefs('x')).toBe('x')
    expect(omitServerOnlyPrefs([1])).toEqual([1])
  })

  test('omitServerOnlyPrefsFromUser filters the prefs of a user and nothing else', () => {
    const user = { uuid: 'u1', name: 'A', prefs }
    expect(omitServerOnlyPrefsFromUser(user)).toEqual({ uuid: 'u1', name: 'A', prefs: omitServerOnlyPrefs(prefs) })
    expect((user.prefs as any).ai).toBeDefined()
    const withoutPrefs = { uuid: 'u2' }
    expect(omitServerOnlyPrefsFromUser(withoutPrefs)).toBe(withoutPrefs)
    expect(omitServerOnlyPrefsFromUser(null)).toBeNull()
  })

  test('the SQL expressions drop both keys of a column and of a parameter', () => {
    expect(sqlPrefsWithoutServerOnlyKeys('u.prefs')).toBe("u.prefs - 'ai' - 'aiUsage'")
    expect(sqlPrefsParamWithoutServerOnlyKeys('$1')).toBe("COALESCE($1::jsonb, '{}'::jsonb) - 'ai' - 'aiUsage'")
  })

  describe('login responses', () => {
    test('the user of a login body is sent without the server-only prefs', () => {
      const body = { user: { uuid: 'u1', prefs }, survey: null, authToken: 't' }
      expect(omitServerOnlyPrefsFromLoginBody(body)).toEqual({
        user: { uuid: 'u1', prefs: { language: 'en', surveys: { current: 3 } } },
        survey: null,
        authToken: 't',
      })
      expect(omitServerOnlyPrefsFromLoginBody({ twoFactorRequired: true })).toEqual({ twoFactorRequired: true })
      expect(omitServerOnlyPrefsFromLoginBody(undefined)).toBeUndefined()
    })

    const run = (path: string) => {
      const res = createFakeResponse()
      const next = jest.fn()
      stripServerOnlyPrefsFromLoginResponse({ path } as any, res, next)
      expect(next).toHaveBeenCalledTimes(1)
      res.json({ user: { uuid: 'u1', prefs }, authToken: 't' })
      return res.body
    }

    test('the middleware wraps the login and the temporary login routes', () => {
      for (const path of ['/auth/login', '/auth/login/', '/auth/login/temp']) {
        expect(run(path).user.prefs).toEqual({ language: 'en', surveys: { current: 3 } })
      }
    })

    test('the middleware leaves other routes alone', () => {
      expect(run('/auth/user').user.prefs).toBe(prefs)
      expect(run('/auth/login/other').user.prefs).toBe(prefs)
    })
  })
})
