import { getProviderPrefs, withProviderPrefs } from '@server/modules/ai/service/aiProviderPrefs'
import { getPublicSettings } from '@server/modules/ai/service/aiSettingsService'
import { defaultFeatureToggles } from '@server/modules/ai/service/aiUserPrefs'
import { removeLegacyProvider } from '@server/modules/ai/service/legacyProviderSettings'
import * as ProviderResolver from '@server/modules/ai/service/providerResolver'

const storedAi = {
  featuresEnabled: true,
  featureToggles: { chat: true, assistantDesign: true },
  provider: 'openai',
  model: 'gpt-x',
  baseUrl: null,
  apiKeyEncrypted: 'iv:tag:data',
  enabled: true,
  lastTestOk: true,
  lastTestAt: '2026-10-01T00:00:00.000Z',
}

describe('Remove my provider (server)', () => {
  test('removes the converted provider and resets the default; the stored object is not changed', () => {
    const prefs = getProviderPrefs(storedAi)
    expect(removeLegacyProvider(prefs)).toEqual({
      defaultProviderId: 'arena-default',
      defaultProviderOrigin: 'user',
      providers: [],
    })
    expect(prefs.providers).toHaveLength(1)
    expect(storedAi.provider).toBe('openai')
  })

  test('after the removal the user has the switches and calls use the admin default', () => {
    const ai = withProviderPrefs(storedAi, removeLegacyProvider(getProviderPrefs(storedAi)))
    const user = { uuid: 'u1', prefs: { ai } }
    expect(getPublicSettings(user)).toMatchObject({
      featuresEnabled: true,
      featureToggles: { ...defaultFeatureToggles(), chat: true, assistantDesign: true },
      provider: null,
      model: null,
      enabled: false,
      hasApiKey: false,
      providers: [],
    })
    expect(ProviderResolver.getDefaultGatewayProviderId(user)).toBe('arena-default')
  })
})

describe('describeAdminDefault', () => {
  test('no admin default', () => {
    expect(ProviderResolver.describeAdminDefault(null, [])).toBeNull()
  })

  test('an allowlisted base URL is org-hosted', () => {
    const adminConfig = {
      provider: 'openai-compatible',
      model: 'org-model',
      baseUrl: 'http://10.0.0.5:8000/v1',
      apiKey: 'sk-admin',
    }
    expect(ProviderResolver.describeAdminDefault(adminConfig, ['http://10.0.0.5:8000/v1'])).toEqual({
      provider: 'openai-compatible',
      model: 'org-model',
      hostingClass: 'orgHosted',
    })
  })

  test('a cloud provider without a model; the key is never returned', () => {
    const adminConfig = { provider: 'openai', model: undefined, baseUrl: undefined, apiKey: 'sk-admin' }
    const described = ProviderResolver.describeAdminDefault(adminConfig, [])
    expect(described).toEqual({ provider: 'openai', model: null, hostingClass: 'cloud' })
    expect(JSON.stringify(described)).not.toContain('sk-admin')
  })
})
