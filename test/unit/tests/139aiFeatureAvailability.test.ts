import type { AiHostingClass, AiPolicy } from '@common/ai/policy'
import en from '@core/i18n/resources/en'
import es from '@core/i18n/resources/es'
import fr from '@core/i18n/resources/fr'
import ja from '@core/i18n/resources/ja'
import mn from '@core/i18n/resources/mn'
import pt from '@core/i18n/resources/pt'
import ru from '@core/i18n/resources/ru'

import { createCapabilitiesStore, isCapabilitiesLoadedForUser } from '@webapp/ai/engines/capabilities'
import {
  getAiEngineFeatureAvailability,
  getAiUnavailableReasonActions,
  getAiUnavailableReasonKey,
  NO_DATA_LOCATION,
  toDataLocation,
} from '@webapp/ai/engines/featureAvailability'
import type {
  AiCapabilities,
  AiLocalServerCapability,
  AiProviderEntry,
  AiUnavailableReason,
} from '@webapp/ai/engines/types'
import { getAiDataLocationText } from '@webapp/ai/policy/aiFeatureAvailability'

const DEFAULT_POLICY: AiPolicy = { schema: 'cloud', data: 'onDevice' }

/** Builds a local provider entry. */
const localEntry = (id: string, name: string, baseUrl: string, hostingClass: AiHostingClass): AiProviderEntry => ({
  id,
  kind: 'local',
  type: 'local',
  name,
  model: 'local-model',
  baseUrl,
  hostingClass,
  status: 'ready',
})

/** Builds a local server probe result. */
const probe = (baseUrl: string, hostingClass: AiHostingClass): AiLocalServerCapability => ({
  reachable: true,
  models: ['local-model'],
  hostingClass,
  contextTokens: 8192,
  baseUrl,
  modelId: 'local-model',
  error: null,
})

const PROVIDERS: AiProviderEntry[] = [
  {
    id: 'acct:a1',
    kind: 'account',
    type: 'openai',
    name: 'My OpenAI',
    model: 'gateway-model',
    baseUrl: null,
    hostingClass: 'cloud',
    status: 'ready',
  },
  localEntry('local:l1', 'Local server', 'http://localhost:1234/v1', 'onDevice'),
  localEntry('local:lan', 'Lab server', 'http://10.0.0.5:8000/v1', 'orgHosted'),
  {
    id: 'arena-default',
    kind: 'arenaDefault',
    type: 'openai',
    name: 'Arena default',
    model: 'admin-model',
    baseUrl: null,
    hostingClass: 'cloud',
    status: 'ready',
  },
]

/** Builds capabilities with the given default. */
const capabilities = (defaultProviderId = 'acct:a1'): AiCapabilities => ({
  instance: { policyCeilings: { schema: 'cloud', data: 'cloud' }, orgHostedBaseUrls: [], maxPromptChars: 200000 },
  providers: PROVIDERS,
  defaultProviderId,
  local: {
    'local:l1': probe('http://localhost:1234/v1', 'onDevice'),
    'local:lan': probe('http://10.0.0.5:8000/v1', 'orgHosted'),
  },
})

/** Computes the feature availability with overrides of the default inputs. */
const availability = (overrides: Partial<Parameters<typeof getAiEngineFeatureAvailability>[0]> = {}) =>
  getAiEngineFeatureAvailability({
    enabled: true,
    effective: DEFAULT_POLICY,
    dataClass: 'schema',
    surveyScoped: true,
    capabilities: capabilities(),
    ...overrides,
  })

describe('isCapabilitiesLoadedForUser', () => {
  const store = createCapabilitiesStore({
    loadSettings: async () => null,
    loadLocalProviders: () => [],
    probe: async () => null as never,
  })

  test('false before the first load, so the empty snapshot is not reported as noEngine; true after, for that user only', async () => {
    expect(isCapabilitiesLoadedForUser(store, 'u1')).toBe(false)
    await store.load({ userUuid: 'u1' })
    expect(isCapabilitiesLoadedForUser(store, 'u1')).toBe(true)
    expect(isCapabilitiesLoadedForUser(store, 'u2')).toBe(false)
    expect(isCapabilitiesLoadedForUser(store, null)).toBe(false)
  })
})

const REASONS: AiUnavailableReason[] = [
  'policyForbids',
  'notAvailable',
  'missingOnThisBrowser',
  'notSetUp',
  'invalidAddress',
]

describe('getAiEngineFeatureAvailability', () => {
  test('disabled when the feature is off, or while the policy is loading', () => {
    expect(availability({ enabled: false }).status).toBe('disabled')
    expect(availability({ effective: null }).status).toBe('disabled')
  })

  test('an account provider: cloud location with the provider name', () => {
    const result = availability()
    expect(result.status).toBe('available')
    expect(result.location).toEqual({
      hostingClass: 'cloud',
      provider: 'My OpenAI',
      model: 'gateway-model',
      engine: null,
      nameKey: null,
    })
    expect(result.engine?.providerId).toBe('acct:a1')
  })

  test('a local provider on this device: its name and the model', () => {
    const result = availability({ dataClass: 'data', capabilities: capabilities('local:l1') })
    expect(result.status).toBe('available')
    expect(result.location).toEqual({
      hostingClass: 'onDevice',
      provider: null,
      model: 'local-model',
      engine: 'Local server',
      // the default name is shown translated
      nameKey: 'userAiSettings:defaultName.local',
    })
  })

  test('a local provider on the organisation network: its name', () => {
    const result = availability({
      effective: { schema: 'orgHosted', data: 'orgHosted' },
      capabilities: capabilities('local:lan'),
    })
    expect(result.location).toEqual({
      hostingClass: 'orgHosted',
      provider: null,
      model: 'local-model',
      engine: 'Lab server',
      nameKey: null,
    })
  })

  test("the conversation's provider decides the badge", () => {
    expect(availability({ providerId: 'local:l1' }).engine?.id).toBe('localServer')
    expect(availability({ providerId: 'acct:removed' }).engine?.providerId).toBe('acct:a1')
  })

  test('noEngine when the default cannot be used: one text, no badge', () => {
    const result = availability({ capabilities: capabilities('local:gone') })
    expect(result.status).toBe('noEngine')
    expect(result.reasons).toEqual(['missingOnThisBrowser'])
    expect(result.reasonKeys).toEqual(['aiEngine.unavailable.missingOnThisBrowser'])
    expect(result.location).toEqual(NO_DATA_LOCATION)
  })

  test("policyBlocked when only the policy blocks, with B's policy message", () => {
    const off: AiPolicy = { schema: 'off', data: 'off' }
    const result = availability({ effective: off })
    expect(result.status).toBe('policyBlocked')
    expect(result.reasons).toEqual(['policyForbids'])
    expect(result.reasonKeys).toEqual(['aiPolicy.blocked.schema.off'])
    const help = availability({ effective: off, surveyScoped: false })
    expect(help.reasonKeys).toEqual(['aiPolicy.blockedByInstance.schema'])
    expect(help.surveyScoped).toBe(false)
  })
})

describe('helpers', () => {
  test('reason keys and actions', () => {
    expect(getAiUnavailableReasonKey('notAvailable')).toBe('aiEngine.unavailable.notAvailable')
    expect(REASONS.map(getAiUnavailableReasonActions)).toEqual([
      ['changePolicy'],
      ['retry', 'openSettings'],
      ['openSettings'],
      ['openSettings'],
      ['openSettings'],
    ])
  })

  test('toDataLocation: the gateway names its provider', () => {
    const engine = { id: 'gateway', hostingClass: 'orgHosted', label: 'openai-compatible', model: 'm' } as const
    expect(toDataLocation({ ...engine, limits: { maxPromptChars: 1, maxSteps: 1 } })).toEqual({
      hostingClass: 'orgHosted',
      provider: 'openai-compatible',
      model: 'm',
      engine: null,
      nameKey: null,
    })
  })

  test("B's location text names the organisation server's host", () => {
    /** Test translation function: the key and its params. */
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
    expect(resources[lang].common.aiEngine.unavailable.missingOnThisBrowser).toMatch(/[Ѐ-ӿ]/)
  })

  test('every reason and action has an English text', () => {
    const { aiEngine } = resources.en.common
    for (const reason of REASONS) {
      expect(typeof aiEngine.unavailable[reason]).toBe('string')
      for (const action of getAiUnavailableReasonActions(reason)) {
        expect(typeof aiEngine.action[action]).toBe('string')
      }
    }
  })
})
