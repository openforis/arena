import * as User from '@core/user/user'

describe('User prefs - notifyOnUserAccessRequest', () => {
  describe('getPrefNotifyOnUserAccessRequest', () => {
    it('defaults to true when user has no prefs at all', () => {
      expect(User.getPrefNotifyOnUserAccessRequest({})).toBe(true)
    })

    it('defaults to true when prefs exist but the key is missing', () => {
      expect(User.getPrefNotifyOnUserAccessRequest({ prefs: { language: 'en' } })).toBe(true)
    })

    it('defaults to true when the stored value is null', () => {
      expect(User.getPrefNotifyOnUserAccessRequest({ prefs: { notifyOnUserAccessRequest: null } })).toBe(true)
    })

    it('returns false when explicitly disabled', () => {
      expect(User.getPrefNotifyOnUserAccessRequest({ prefs: { notifyOnUserAccessRequest: false } })).toBe(false)
    })

    it('returns true when explicitly enabled', () => {
      expect(User.getPrefNotifyOnUserAccessRequest({ prefs: { notifyOnUserAccessRequest: true } })).toBe(true)
    })
  })

  describe('assocPrefNotifyOnUserAccessRequest', () => {
    it('sets the pref on a user with no prefs', () => {
      const user = User.assocPrefNotifyOnUserAccessRequest(false)({})
      expect(user.prefs.notifyOnUserAccessRequest).toBe(false)
    })

    it('preserves other prefs', () => {
      const user = User.assocPrefNotifyOnUserAccessRequest(false)({
        prefs: { language: 'fr', surveys: { current: 3 } },
      })
      expect(user.prefs.language).toBe('fr')
      expect(user.prefs.surveys.current).toBe(3)
      expect(user.prefs.notifyOnUserAccessRequest).toBe(false)
    })

    it('does not mutate the original user', () => {
      const original = { prefs: { language: 'fr' } }
      User.assocPrefNotifyOnUserAccessRequest(false)(original)
      expect(original.prefs.notifyOnUserAccessRequest).toBeUndefined()
    })

    it('round-trips through the getter', () => {
      const user = User.assocPrefNotifyOnUserAccessRequest(false)({})
      expect(User.getPrefNotifyOnUserAccessRequest(user)).toBe(false)
    })
  })
})
