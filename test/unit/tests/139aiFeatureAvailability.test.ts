import type { AiPolicy } from '@common/ai/policy'
import en from '@core/i18n/resources/en'
import es from '@core/i18n/resources/es'
import fr from '@core/i18n/resources/fr'
import ja from '@core/i18n/resources/ja'
import mn from '@core/i18n/resources/mn'
import pt from '@core/i18n/resources/pt'
import ru from '@core/i18n/resources/ru'

import {
  getAiEngineFeatureAvailability,
  getAiUnavailableAction,
  getAiUnavailableReasonKey,
  NO_DATA_LOCATION,
  toDataLocation,
} from '@webapp/ai/engines/featureAvailability'
import type { AiCapabilities, AiUnavailableReason } from '@webapp/ai/engines/types'
import { getAiDataLocationText } from '@webapp/ai/policy/aiFeatureAvailability'

const DEFAULT_POLICY: AiPolicy = { schema: 'cloud', data: 'onDevice' }

const capabilities = ({ local = 'off', gateway = true } = {}): AiCapabilities => ({
  localServer: {
    enabled: local !== 'off',
    reachable: local === 'off' ? null : local !== 'down',
    models: ['local-model'],
    hostingClass: local === 'lan' ? 'orgHosted' : 'onDevice',
    contextTokens: 8192,
    baseUrl: local === 'lan' ? 'http://10.0.0.5:8000/v1' : 'http://localhost:1234/v1',
    modelId: 'local-model',
    error: null,
  },
  gateway: {
    available: gateway,
    hostingClass: gateway ? 'cloud' : null,
    provider: gateway ? 'openai' : null,
    model: gateway ? 'gateway-model' : null,
    maxPromptChars: 200000,
  },
  device: { webGpu: false, deviceMemoryGb: null, promptApi: null },
  instance: { policyCeilings: { schema: 'cloud', data: 'cloud' }, orgHostedBaseUrls: [] },
})

const availability = (overrides: Partial<Parameters<typeof getAiEngineFeatureAvailability>[0]> = {}) =>
  getAiEngineFeatureAvailability({
    enabled: true,
    effective: DEFAULT_POLICY,
    dataClass: 'schema',
    surveyScoped: true,
    capabilities: capabilities(),
    preferLocal: true,
    ...overrides,
  })

const REASONS: AiUnavailableReason[] = [
  'localServerNotEnabled',
  'localServerUnreachable',
  'localServerNoModel',
  'gatewayNotConfigured',
  'policyForbidsCloud',
  'policyForbidsOrgHosted',
  'policyForbidsAll',
]

describe('getAiEngineFeatureAvailability', () => {
  test('disabled when the feature is off, or while the policy is loading', () => {
    expect(availability({ enabled: false }).status).toBe('disabled')
    expect(availability({ effective: null }).status).toBe('disabled')
  })

  test('gateway: cloud location with the provider', () => {
    const result = availability()
    expect(result.status).toBe('available')
    expect(result.location).toEqual({ hostingClass: 'cloud', provider: 'openai', model: 'gateway-model', engine: null })
    expect(result.engine?.id).toBe('gateway')
  })

  test('local server on this device: LM Studio and the model', () => {
    const result = availability({ dataClass: 'data', capabilities: capabilities({ local: 'on' }) })
    expect(result.status).toBe('available')
    expect(result.location).toEqual({
      hostingClass: 'onDevice',
      provider: null,
      model: 'local-model',
      engine: 'LM Studio',
    })
  })

  test('local server on the organisation network: the host', () => {
    const result = availability({
      effective: { schema: 'orgHosted', data: 'orgHosted' },
      capabilities: capabilities({ local: 'lan', gateway: false }),
    })
    expect(result.location).toEqual({
      hostingClass: 'orgHosted',
      provider: null,
      model: 'local-model',
      engine: '10.0.0.5:8000',
    })
  })

  test('noEngine when something the user can change would help: one text per reason, no badge', () => {
    const result = availability({ dataClass: 'data' })
    expect(result.status).toBe('noEngine')
    expect(result.reasons).toEqual(['localServerNotEnabled', 'policyForbidsCloud'])
    expect(result.reasonKeys).toEqual([
      'aiEngine.unavailable.localServerNotEnabled',
      'aiEngine.unavailable.policyForbidsCloud',
    ])
    expect(result.location).toEqual(NO_DATA_LOCATION)
  })

  test("policyBlocked when only the policy blocks, with B's policy message", () => {
    const off: AiPolicy = { schema: 'off', data: 'off' }
    const result = availability({ effective: off })
    expect(result.status).toBe('policyBlocked')
    expect(result.reasons).toEqual(['policyForbidsAll'])
    expect(result.reasonKeys).toEqual(['aiPolicy.blocked.schema.off'])
    const help = availability({ effective: off, surveyScoped: false })
    expect(help.reasonKeys).toEqual(['aiPolicy.blockedByInstance.schema'])
    expect(help.surveyScoped).toBe(false)
  })

  test('the preference after consent decides the badge when both engines qualify', () => {
    const both = capabilities({ local: 'on' })
    expect(availability({ capabilities: both, preferLocal: true }).engine?.id).toBe('localServer')
    expect(availability({ capabilities: both, preferLocal: false }).engine?.id).toBe('gateway')
  })
})

describe('helpers', () => {
  test('reason keys and actions', () => {
    expect(getAiUnavailableReasonKey('localServerUnreachable')).toBe('aiEngine.unavailable.localServerUnreachable')
    expect(REASONS.map(getAiUnavailableAction)).toEqual([
      'turnOnLocalServer',
      'retry',
      'chooseModel',
      'configureProvider',
      'changePolicy',
      'changePolicy',
      'changePolicy',
    ])
  })

  test('toDataLocation: the gateway names its provider', () => {
    const engine = { id: 'gateway', hostingClass: 'orgHosted', label: 'openai-compatible', model: 'm' } as const
    expect(toDataLocation({ ...engine, limits: { maxPromptChars: 1, maxSteps: 1 } })).toEqual({
      hostingClass: 'orgHosted',
      provider: 'openai-compatible',
      model: 'm',
      engine: null,
    })
  })

  test("B's location text names the organisation server's host", () => {
    const t = (key: string, params?: object) => `${key}${params ? JSON.stringify(params) : ''}`
    const location = { hostingClass: 'orgHosted', provider: null, model: null } as const
    expect(getAiDataLocationText({ location: { ...location, engine: '10.0.0.5:8000' }, t })).toBe(
      'aiDataLocation.orgHostedWithEngine{"engine":"10.0.0.5:8000"}'
    )
    expect(getAiDataLocationText({ location, t })).toBe('aiDataLocation.orgHosted')
  })
})

const resources: Record<string, any> = { en, es, fr, ja, mn, pt, ru }

// flattened "a.b.c" paths of every string leaf
const leafPaths = (obj: any, prefix = ''): string[] => {
  const paths: string[] = []
  for (const [key, value] of Object.entries(obj ?? {})) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') paths.push(path)
    else paths.push(...leafPaths(value, path))
  }
  return paths.sort()
}

describe('engine strings', () => {
  test.each(Object.keys(resources))('%s has every aiEngine key of en, and orgHostedWithEngine', (lang) => {
    const { common } = resources[lang]
    expect(leafPaths(common.aiEngine)).toEqual(leafPaths(resources.en.common.aiEngine))
    expect(common.aiDataLocation.orgHostedWithEngine).toContain('{{engine}}')
  })

  test.each(['ru', 'mn'])('%s texts are in Cyrillic', (lang) => {
    expect(resources[lang].common.aiEngine.unavailable.localServerNotEnabled).toMatch(/[Ѐ-ӿ]/)
  })

  test('every reason and action has an English text', () => {
    const { aiEngine } = resources.en.common
    for (const reason of REASONS) {
      expect(typeof aiEngine.unavailable[reason]).toBe('string')
      expect(typeof aiEngine.action[getAiUnavailableAction(reason)]).toBe('string')
    }
    expect(typeof aiEngine.action.openSettings).toBe('string')
  })
})
