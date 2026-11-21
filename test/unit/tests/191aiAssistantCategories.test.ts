import { AiFeatureCategory, AiFeatures } from '@common/ai/features'
import { defaultFeatureToggles, sanitiseFeatureToggles } from '@server/modules/ai/service/aiUserPrefs'
import { assertFeatureEnabled } from '@server/modules/ai/service/featureGate'
import { isAiFeatureEnabledInSettings } from '@webapp/ai/engines/featureSwitches'

const ASSISTANT_FEATURES = ['assistantDesign', 'assistantAnalysis', 'assistantCleaning']

const envOn = { aiFeaturesEnabled: true, aiFeatureFlags: null }

const userWith = (featureToggles: Record<string, unknown>): any => ({
  uuid: 'u1',
  prefs: { ai: { featuresEnabled: true, featureToggles } },
})

// the key of the SystemError thrown by the gate, null when the feature may be used
const gateError = (feature: string, user: unknown): string | null => {
  try {
    assertFeatureEnabled(feature, user as any, envOn)
    return null
  } catch (error: any) {
    return error?.key ?? 'unexpected'
  }
}

describe('assistant categories', () => {
  test('each assistant area has its own category', () => {
    expect(AiFeatures.assistantDesign.category).toBe(AiFeatureCategory.assistantDesign)
    expect(AiFeatures.assistantAnalysis.category).toBe(AiFeatureCategory.assistantAnalysis)
    expect(AiFeatures.assistantCleaning.category).toBe(AiFeatureCategory.assistantCleaning)
    expect(Object.values(AiFeatureCategory)).not.toContain('assistant')
  })

  test('the three switches are off by default', () => {
    expect(defaultFeatureToggles()).toMatchObject({
      assistantDesign: false,
      assistantAnalysis: false,
      assistantCleaning: false,
    })
  })

  test('a stored legacy assistant switch turns none of them on', () => {
    const toggles = sanitiseFeatureToggles({ assistant: true, chat: true })
    expect(toggles).toEqual({ ...defaultFeatureToggles(), chat: true })
    expect(Object.keys(toggles)).not.toContain('assistant')
    const legacyUser = userWith({ assistant: true })
    for (const feature of ASSISTANT_FEATURES) {
      expect([feature, gateError(feature, legacyUser)]).toEqual([feature, 'aiFeatureDisabled'])
    }
  })

  test('Design on alone: the gate refuses Analysis and Cleaning', () => {
    const user = userWith({ assistantDesign: true })
    expect(gateError('assistantDesign', user)).toBeNull()
    expect(gateError('assistantAnalysis', user)).toBe('aiFeatureDisabled')
    expect(gateError('assistantCleaning', user)).toBe('aiFeatureDisabled')
  })

  test('the browser switches follow the same categories', () => {
    const settings = { featuresEnabled: true, featureToggles: { assistantCleaning: true }, disabledFeatures: [] }
    expect(isAiFeatureEnabledInSettings(settings, 'assistantCleaning')).toBe(true)
    expect(isAiFeatureEnabledInSettings(settings, 'assistantDesign')).toBe(false)
    expect(isAiFeatureEnabledInSettings(settings, 'assistantAnalysis')).toBe(false)
    const legacy = { ...settings, featureToggles: { assistant: true } }
    for (const feature of ASSISTANT_FEATURES) {
      expect([feature, isAiFeatureEnabledInSettings(legacy, feature)]).toEqual([feature, false])
    }
  })
})
