import { getPublicSettings } from '@server/modules/ai/service/aiSettingsService'
import {
  areFeaturesEnabledForUser,
  getAccessLevelForUser,
  isCategoryEnabledForUser,
  resolveSavedAccess,
} from '@server/modules/ai/service/aiUserPrefs'
import { assertFeatureEnabled } from '@server/modules/ai/service/featureGate'

const userWith = (ai: unknown): any => ({ uuid: 'u1', prefs: { ai } })
const envOn = { aiFeaturesEnabled: true, aiFeatureFlags: null }
const allOn = {
  chat: true,
  assistantSuggestions: true,
  expressions: true,
  translation: true,
  assistantDesign: true,
  dataQuery: true,
  dataDictionary: true,
  assistantAnalysis: true,
  assistantCleaning: true,
  userActivity: true,
}

describe('access level on the server (251)', () => {
  test('prefs saved before the levels keep their features', () => {
    const user = userWith({ featuresEnabled: true, featureToggles: { chat: true, translation: true } })
    expect(getAccessLevelForUser(user)).toBe(2)
    expect(isCategoryEnabledForUser(user, 'translation')).toBe(true)
    expect(getAccessLevelForUser(userWith(null))).toBe(0)
    expect(getAccessLevelForUser({ uuid: 'u1', prefs: {} } as any)).toBe(0)
  })

  test('a category above the level is off even when its toggle is on', () => {
    const user = userWith({ accessLevel: 1, featuresEnabled: true, featureToggles: allOn })
    expect(isCategoryEnabledForUser(user, 'chat')).toBe(true)
    expect(isCategoryEnabledForUser(user, 'expressions')).toBe(false)
    expect(isCategoryEnabledForUser(user, 'assistantCleaning')).toBe(false)
    let thrown: any = null
    try {
      assertFeatureEnabled('assistantCleaning', user, envOn)
    } catch (error) {
      thrown = error
    }
    expect([thrown?.key, thrown?.statusCode]).toEqual(['aiFeatureDisabled', 403])
  })

  test('level 0 turns everything off', () => {
    const user = userWith({ accessLevel: 0, featuresEnabled: false, featureToggles: allOn })
    expect(areFeaturesEnabledForUser(user)).toBe(false)
    expect(isCategoryEnabledForUser(user, 'chat')).toBe(false)
  })

  test('a save with a level stores it and derives featuresEnabled', () => {
    expect(resolveSavedAccess({ accessLevel: 2, featureToggles: { chat: true } })).toMatchObject({
      accessLevel: 2,
      featuresEnabled: true,
      featureToggles: expect.objectContaining({ chat: true, assistantSuggestions: true }),
    })
    expect(resolveSavedAccess({ accessLevel: 0, featuresEnabled: true, featureToggles: allOn })).toMatchObject({
      accessLevel: 0,
      featuresEnabled: false,
    })
  })

  test('a save without a level (old clients, e2e fixtures) derives it', () => {
    expect(resolveSavedAccess({ featuresEnabled: true, featureToggles: allOn })).toMatchObject({
      accessLevel: 3,
      featuresEnabled: true,
    })
    expect(resolveSavedAccess({ featuresEnabled: false })).toMatchObject({ accessLevel: 0, featuresEnabled: false })
    expect(
      resolveSavedAccess({ accessLevel: 'all', featuresEnabled: true, featureToggles: { chat: true } })
    ).toMatchObject({ accessLevel: 1, featuresEnabled: true })
  })

  test('the public settings carry the level', () => {
    expect(
      getPublicSettings(userWith({ featuresEnabled: true, featureToggles: { userActivity: true } }))
    ).toMatchObject({
      accessLevel: 3,
      featuresEnabled: true,
    })
    expect(getPublicSettings(userWith(null))).toMatchObject({ accessLevel: 0, featuresEnabled: false })
  })
})
