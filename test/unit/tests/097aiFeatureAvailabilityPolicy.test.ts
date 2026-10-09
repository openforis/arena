import { aiPolicyDataClasses } from '@common/ai/policy'
import en from '@core/i18n/resources/en'

import {
  getAiDataLocationText,
  getAiFeatureAvailability,
  getPolicyBlockedReasonKeys,
  isAiFeatureShown,
  isAiFeatureUsable,
  isSurveyScopedFeature,
  resolveEffectivePolicy,
} from '@webapp/ai/policy/aiFeatureAvailability'

const cloud = { hostingClass: 'cloud' as const, provider: 'openai', model: 'm' }
const orgHosted = { hostingClass: 'orgHosted' as const, provider: 'openai-compatible', model: 'm' }
const notConfigured = { hostingClass: null, provider: null, model: null }
const defaults = { schema: 'cloud', data: 'onDevice' } as const

describe('getAiFeatureAvailability', () => {
  test('AI off for the user → disabled', () => {
    const result = getAiFeatureAvailability({
      feature: 'expressionGenerate',
      enabled: false,
      effective: defaults,
      location: cloud,
    })
    expect(result.status).toBe('disabled')
    expect(isAiFeatureShown(result)).toBe(false)
  })

  test('policy not loaded yet → disabled', () => {
    const result = getAiFeatureAvailability({
      feature: 'expressionGenerate',
      enabled: true,
      effective: null,
      location: cloud,
    })
    expect(result.status).toBe('disabled')
  })

  test('no provider configured → available (the call reports aiNotConfigured)', () => {
    const result = getAiFeatureAvailability({
      feature: 'activityLogSummary',
      enabled: true,
      effective: defaults,
      location: notConfigured,
    })
    expect(result.status).toBe('available')
  })

  test('a schema feature with the defaults → available, with the location', () => {
    const result = getAiFeatureAvailability({
      feature: 'translation',
      enabled: true,
      effective: defaults,
      location: cloud,
    })
    expect(result).toEqual({ status: 'available', location: cloud })
    expect(isAiFeatureUsable(result)).toBe(true)
  })

  test('the activity-log summary with the defaults → policyBlocked (record data on this device)', () => {
    const result = getAiFeatureAvailability({
      feature: 'activityLogSummary',
      enabled: true,
      effective: defaults,
      location: cloud,
    })
    expect(result).toEqual({ status: 'policyBlocked', location: cloud, reasonKeys: ['aiPolicy.blocked.data.onDevice'] })
    expect(isAiFeatureShown(result)).toBe(true)
    expect(isAiFeatureUsable(result)).toBe(false)
  })

  test('survey design Off blocks the expression features', () => {
    const effective = { schema: 'off', data: 'cloud' } as const
    const result = getAiFeatureAvailability({ feature: 'expressionExplain', enabled: true, effective, location: cloud })
    expect(result.reasonKeys).toEqual(['aiPolicy.blocked.schema.off'])
  })

  test('organisation server level: org server allowed, cloud blocked', () => {
    const effective = { schema: 'orgHosted', data: 'orgHosted' } as const
    expect(
      getAiFeatureAvailability({ feature: 'dataQueryGenerate', enabled: true, effective, location: orgHosted }).status
    ).toBe('available')
    expect(
      getAiFeatureAvailability({ feature: 'dataQueryGenerate', enabled: true, effective, location: cloud }).reasonKeys
    ).toEqual(['aiPolicy.blocked.schema.orgHosted'])
  })

  test('the Help chat is checked against the instance ceilings', () => {
    expect(isSurveyScopedFeature('chatbot')).toBe(false)
    expect(isSurveyScopedFeature('expressionGenerate')).toBe(true)
    const result = getAiFeatureAvailability({
      feature: 'chatbot',
      enabled: true,
      effective: { schema: 'orgHosted', data: 'off' },
      location: cloud,
    })
    expect(result.reasonKeys).toEqual(['aiPolicy.blockedByInstance.schema'])
  })

  test('every reason key has an English text', () => {
    const getPath = (obj: any, path: string) => path.split('.').reduce((acc, part) => acc?.[part], obj)
    for (const dataClass of aiPolicyDataClasses) {
      for (const allowed of ['off', 'onDevice', 'orgHosted'] as const) {
        for (const surveyScoped of [true, false]) {
          for (const key of getPolicyBlockedReasonKeys({ dataClass, allowed, surveyScoped })) {
            expect(typeof getPath(en.common, key)).toBe('string')
          }
        }
      }
    }
  })
})

describe('getAiDataLocationText', () => {
  const t = (key: string, params?: object) => `${key}${params ? JSON.stringify(params) : ''}`

  test.each([
    [cloud, 'aiDataLocation.cloudWithProvider{"provider":"OpenAI"}'],
    [{ hostingClass: 'cloud', provider: 'mock', model: null }, 'aiDataLocation.cloudWithProvider{"provider":"mock"}'],
    [{ hostingClass: 'cloud', provider: null, model: null }, 'aiDataLocation.cloud'],
    [orgHosted, 'aiDataLocation.orgHosted'],
    [{ hostingClass: 'onDevice', provider: null, model: null }, 'aiDataLocation.onDevice'],
    [
      { hostingClass: 'onDevice', provider: null, model: null, engine: 'LM Studio' },
      'aiDataLocation.onDeviceWithEngine{"engine":"LM Studio"}',
    ],
    [notConfigured, null],
  ])('%j → %s', (location, expected) => {
    expect(getAiDataLocationText({ location: location as any, t })).toBe(expected)
  })
})

describe('resolveEffectivePolicy', () => {
  const ceilings = { schema: 'orgHosted', data: 'onDevice' } as const
  const state = { effective: defaults }

  test('survey-scoped feature uses the survey effective policy', () => {
    expect(resolveEffectivePolicy({ surveyScoped: true, state, error: null, ceilings })).toEqual(defaults)
  })

  test('survey-scoped feature with no state yet → null', () => {
    expect(resolveEffectivePolicy({ surveyScoped: true, state: null, error: null, ceilings })).toBeNull()
  })

  test('a failed refetch with a stale cached state fails closed → null', () => {
    expect(resolveEffectivePolicy({ surveyScoped: true, state, error: new Error('network'), ceilings })).toBeNull()
  })

  test('the Help chat uses the ceilings, whatever the survey policy state', () => {
    expect(resolveEffectivePolicy({ surveyScoped: false, state: null, error: new Error('x'), ceilings })).toEqual(
      ceilings
    )
  })

  test('a failed refetch makes the feature disabled, never available', () => {
    const effective = resolveEffectivePolicy({ surveyScoped: true, state, error: new Error('network'), ceilings })
    const result = getAiFeatureAvailability({ feature: 'translation', enabled: true, effective, location: cloud })
    expect(result.status).toBe('disabled')
  })
})
