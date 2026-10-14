import { isAiCategoryEnabledInSettings } from '@webapp/ai/engines/featureSwitches'
import {
  buildSettingsUpdate,
  countAccessLevelFeatures,
  createEmptyForm,
  settingsToForm,
  withAccessLevel,
} from '@webapp/components/ai/UserAiSettingsPanel/aiSettingsForm'

describe('access level in the browser (252)', () => {
  test('the switches check the level', () => {
    const featureToggles = { chat: true, assistantCleaning: true }
    expect(isAiCategoryEnabledInSettings({ accessLevel: 1, featuresEnabled: true, featureToggles }, 'chat')).toBe(true)
    expect(
      isAiCategoryEnabledInSettings({ accessLevel: 1, featuresEnabled: true, featureToggles }, 'assistantCleaning')
    ).toBe(false)
    expect(
      isAiCategoryEnabledInSettings({ accessLevel: 3, featuresEnabled: true, featureToggles }, 'assistantCleaning')
    ).toBe(true)
  })

  test('settings without a level (cached before the deploy) are derived', () => {
    const featureToggles = { chat: true, assistantCleaning: true }
    expect(isAiCategoryEnabledInSettings({ featuresEnabled: true, featureToggles }, 'assistantCleaning')).toBe(true)
    expect(isAiCategoryEnabledInSettings({ featuresEnabled: false, featureToggles }, 'chat')).toBe(false)
  })

  test('the form loads the level, derived when absent', () => {
    expect(createEmptyForm().accessLevel).toBe(0)
    expect(settingsToForm({ accessLevel: 2, featuresEnabled: true, featureToggles: { chat: true } }).accessLevel).toBe(
      2
    )
    expect(settingsToForm({ featuresEnabled: true, featureToggles: { userActivity: true } }).accessLevel).toBe(3)
    expect(settingsToForm({}).accessLevel).toBe(0)
  })

  test('changing the level switches on the newly included features', () => {
    const form = withAccessLevel(createEmptyForm(), 2)
    expect(form.accessLevel).toBe(2)
    expect(form.featureToggles).toMatchObject({
      chat: true,
      expressions: true,
      dataDictionary: true,
      userActivity: false,
    })
    const lowered = withAccessLevel({ ...form, featureToggles: { ...form.featureToggles, expressions: false } }, 1)
    expect(lowered.featureToggles.expressions).toBe(false)
  })

  test('the count covers the features within the level', () => {
    const { featureToggles } = withAccessLevel(createEmptyForm(), 3)
    expect(countAccessLevelFeatures({ accessLevel: 3, featureToggles })).toEqual({ on: 10, total: 10 })
    expect(
      countAccessLevelFeatures({ accessLevel: 2, featureToggles: { ...featureToggles, dataDictionary: false } })
    ).toEqual({ on: 6, total: 7 })
    expect(countAccessLevelFeatures({ accessLevel: 0, featureToggles })).toEqual({ on: 0, total: 0 })
  })

  test('the save body sends the level and the derived master switch, never a provider field', () => {
    const form = withAccessLevel(createEmptyForm(), 1)
    expect(buildSettingsUpdate(form)).toEqual({
      accessLevel: 1,
      featuresEnabled: true,
      featureToggles: form.featureToggles,
    })
  })
})
