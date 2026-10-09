import { aiPolicyDataClasses } from '@common/ai/policy'
import en from '@core/i18n/resources/en'

import { getAiEngineFeatureAvailability } from '@webapp/ai/engines/featureAvailability'
import type { AiCapabilities } from '@webapp/ai/engines/types'
import {
  getAiDataLocationText,
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

describe('isSurveyScopedFeature', () => {
  test('the Help chat is checked against the instance ceilings', () => {
    expect(isSurveyScopedFeature('chatbot')).toBe(false)
    expect(isSurveyScopedFeature('expressionGenerate')).toBe(true)
  })
})

describe('policy blocked reason keys', () => {
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
    [{ ...orgHosted, engine: '10.0.0.5:8000' }, 'aiDataLocation.orgHostedWithEngine{"engine":"10.0.0.5:8000"}'],
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
    const capabilities = {
      localServer: { enabled: false },
      gateway: { available: true, hostingClass: 'cloud', provider: 'openai', model: 'm', maxPromptChars: 1000 },
      instance: { policyCeilings: ceilings, orgHostedBaseUrls: [] },
    } as unknown as AiCapabilities
    const result = getAiEngineFeatureAvailability({
      enabled: true,
      effective,
      dataClass: 'schema',
      surveyScoped: true,
      capabilities,
      preferLocal: true,
    })
    expect(result.status).toBe('disabled')
    expect(isAiFeatureShown(result)).toBe(false)
    expect(isAiFeatureUsable(result)).toBe(false)
  })
})
