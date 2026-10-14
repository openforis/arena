import * as SettingsApi from '@server/modules/ai/api/settingsApi'
import * as AiSettingsService from '@server/modules/ai/service/aiSettingsService'
import { buildInstanceCapability, emptyCapabilities } from '@webapp/ai/engines/capabilities'
import { selectEngine } from '@webapp/ai/engines/selectEngine'
import type { AiCapabilities, AiProviderEntry } from '@webapp/ai/engines/types'
import * as SettingsClient from '@webapp/service/api/ai/settings'
import { TestId } from '@webapp/utils/testId'

const storedProvider = {
  id: 'acct:a1',
  type: 'openai-compatible',
  name: 'Models',
  model: 'm',
  baseUrl: 'https://models.example.org/v1',
  apiKeyEncrypted: null,
  lastTestOk: true,
  lastTestAt: '2026-10-01T00:00:00.000Z',
}

const listUser = {
  uuid: 'u1',
  prefs: {
    ai: {
      accessLevel: 3,
      featuresEnabled: true,
      featureToggles: {},
      defaultProviderId: 'acct:a1',
      defaultProviderOrigin: 'user',
      providers: [storedProvider],
    },
  },
}

const ACCOUNT: AiProviderEntry = {
  id: 'acct:a1',
  kind: 'account',
  type: 'openai',
  name: 'Mine',
  model: 'gpt-x',
  baseUrl: null,
  hostingClass: 'cloud',
  status: 'ready',
}

/**
 * Returns capabilities with one ready account provider as the default and the given instance prompt cap.
 * @param {number|null} maxPromptChars - Instance prompt cap.
 * @returns {AiCapabilities} The capabilities.
 */
const capabilitiesWithCap = (maxPromptChars: number | null): AiCapabilities => ({
  instance: { policyCeilings: { schema: 'cloud', data: 'cloud' }, orgHostedBaseUrls: [], maxPromptChars },
  providers: [ACCOUNT],
  defaultProviderId: 'acct:a1',
  local: {},
})

/** Returns the sorted keys of an object. */
const sortedKeys = (value: object): string[] => Object.keys(value).sort()

describe('single-provider compatibility removed (273)', () => {
  test('the settings have the provider list only, no single-provider fields', () => {
    expect(sortedKeys(AiSettingsService.getPublicSettings(listUser))).toEqual([
      'accessLevel',
      'defaultProviderId',
      'defaultProviderOrigin',
      'featureToggles',
      'featuresEnabled',
      'providers',
    ])
    expect(sortedKeys(SettingsApi.buildResponseBody(listUser))).toEqual([
      'accessLevel',
      'adminDefault',
      'defaultProviderId',
      'defaultProviderOrigin',
      'disabledFeatures',
      'encryptionConfigured',
      'featureToggles',
      'featuresEnabled',
      'maxPromptChars',
      'mockProviderEnabled',
      'orgHostedBaseUrls',
      'policyCeilings',
      'providers',
    ])
  })

  test('a profile save keeps the providers and the default; old provider fields are ignored', () => {
    const saved = AiSettingsService.buildSavedAiPrefs({
      existing: listUser.prefs.ai,
      update: {
        accessLevel: 2,
        featureToggles: {},
        enabled: true,
        provider: 'openai',
        model: 'gpt-x',
        apiKey: 'sk-old-body',
      },
    })
    expect(saved).toMatchObject({
      accessLevel: 2,
      defaultProviderId: 'acct:a1',
      defaultProviderOrigin: 'user',
      providers: [storedProvider],
    })
    expect(saved).not.toHaveProperty('provider')
    expect(saved).not.toHaveProperty('enabled')
    expect(JSON.stringify(saved)).not.toContain('sk-old-body')

    // a default that was never picked stays 'converted'
    const keptOrigin = AiSettingsService.buildSavedAiPrefs({
      existing: { ...listUser.prefs.ai, defaultProviderOrigin: 'converted' },
      update: { accessLevel: 1, provider: 'openai', enabled: false },
    })
    expect(keptOrigin).toMatchObject({
      defaultProviderId: 'acct:a1',
      defaultProviderOrigin: 'converted',
      providers: [storedProvider],
    })

    // a user who never opened the new list keeps the old provider, written as acct:legacy
    const converted = AiSettingsService.buildSavedAiPrefs({
      existing: {
        featuresEnabled: true,
        enabled: true,
        provider: 'openai',
        model: 'gpt-x',
        apiKeyEncrypted: 'iv:tag:data',
      },
      update: { accessLevel: 3 },
    })
    expect(converted).toMatchObject({
      accessLevel: 3,
      defaultProviderId: 'acct:legacy',
      defaultProviderOrigin: 'converted',
      providers: [
        expect.objectContaining({ id: 'acct:legacy', type: 'openai', model: 'gpt-x', apiKeyEncrypted: 'iv:tag:data' }),
      ],
    })
    expect(converted).not.toHaveProperty('provider')
    expect(converted).not.toHaveProperty('apiKeyEncrypted')
  })

  test('the old single-provider routes and service calls are gone', () => {
    const routes: string[] = []
    /** Returns a route registrar that records `METHOD path`. */
    const register = (method: string) => (path: string) => {
      routes.push(`${method} ${path}`)
    }
    SettingsApi.init({ get: register('GET'), put: register('PUT'), post: register('POST'), delete: register('DELETE') })
    expect(routes.sort()).toEqual([
      'DELETE /ai/providers/:id',
      'GET /ai/settings',
      'POST /ai/providers',
      'POST /ai/providers/models',
      'POST /ai/providers/test',
      'PUT /ai/providers/:id',
      'PUT /ai/settings',
      'PUT /ai/settings/default',
    ])
    for (const name of ['testConnection', 'listModels', 'clearSettings']) {
      expect(Object.keys(AiSettingsService)).not.toContain(name)
    }
  })

  test('the capabilities have the providers and the instance prompt cap, no gateway or single local server', () => {
    expect(sortedKeys(emptyCapabilities())).toEqual(['defaultProviderId', 'instance', 'local', 'providers'])
    expect(buildInstanceCapability({ maxPromptChars: 1000 }).maxPromptChars).toBe(1000)
    for (const value of [0, -5, 'x', null]) {
      expect(buildInstanceCapability({ maxPromptChars: value } as never).maxPromptChars).toBeNull()
    }
    expect(buildInstanceCapability(null)).toEqual({ policyCeilings: null, orgHostedBaseUrls: [], maxPromptChars: null })
  })

  test('a gateway engine takes the instance prompt cap, else the default cap', () => {
    /** Selects the engine of the default account provider with the given instance prompt cap. */
    const select = (maxPromptChars: number | null) =>
      selectEngine({
        effective: { schema: 'cloud', data: 'cloud' },
        dataClass: 'schema',
        capabilities: capabilitiesWithCap(maxPromptChars),
      })
    expect(select(1234)).toEqual({
      engine: {
        id: 'gateway',
        hostingClass: 'cloud',
        label: 'Mine',
        model: 'gpt-x',
        limits: { maxPromptChars: 1234, maxSteps: 10 },
        providerId: 'acct:a1',
      },
    })
    const fallback = select(null)
    expect('engine' in fallback && fallback.engine.limits.maxPromptChars).toBe(200000)
  })

  test('the old settings client calls and testIds are gone', () => {
    const clientCalls = Object.keys(SettingsClient)
    expect(clientCalls).toContain('fetchSettings')
    expect(clientCalls).toContain('saveSettings')
    for (const name of ['testConnection', 'fetchModels', 'clearSettings']) expect(clientCalls).not.toContain(name)
    const leftovers = Object.keys(TestId.ai).filter((key) =>
      /^(cloud|localServer|engineNotice|engineStatus|consentUseOther)/.test(key)
    )
    expect(leftovers).toEqual([])
  })
})
