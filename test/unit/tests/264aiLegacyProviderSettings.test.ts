import { createDefaultAiProviderServiceDeps } from '@server/modules/ai/service/aiProviderService'
import { getProviderPrefs } from '@server/modules/ai/service/aiProviderPrefs'
import { getPublicSettings, listModels, testConnection } from '@server/modules/ai/service/aiSettingsService'
import { applyLegacyProviderUpdate, removeLegacyProvider } from '@server/modules/ai/service/legacyProviderSettings'
import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'

/**
 * Fake key encryption.
 * @param {string} plain - Plain key.
 * @returns {string} The fake envelope.
 */
const encrypt = (plain: string) => `enc:${plain}`
const deps = { ...createDefaultAiProviderServiceDeps(), encrypt, isEncryptionConfigured: () => true }
const oldBody = {
  featuresEnabled: true,
  enabled: true,
  provider: 'openai-compatible',
  model: 'remote-model',
  baseUrl: 'https://models.example.org/v1',
}
const legacyCompatible = {
  id: 'acct:legacy',
  type: 'openai-compatible',
  name: 'OpenAI-compatible',
  model: 'remote-model',
  baseUrl: 'https://models.example.org/v1',
  apiKeyEncrypted: null,
  lastTestOk: null,
  lastTestAt: null,
}

describe('old settings body and single-provider fields (264)', () => {
  test('the old PUT with a provider and enabled stores acct:legacy as the default', () => {
    expect(applyLegacyProviderUpdate({ prefs: getProviderPrefs(null), update: oldBody, deps })).toEqual({
      defaultProviderId: 'acct:legacy',
      defaultProviderOrigin: 'user',
      providers: [legacyCompatible],
    })
  })

  test('the old PUT with enabled false goes back to Arena default and keeps the provider', () => {
    const prefs = applyLegacyProviderUpdate({ prefs: getProviderPrefs(null), update: oldBody, deps })
    expect(applyLegacyProviderUpdate({ prefs, update: { featuresEnabled: false, enabled: false }, deps })).toEqual({
      defaultProviderId: 'arena-default',
      defaultProviderOrigin: 'user',
      providers: [legacyCompatible],
    })
  })

  test('saving acct:legacy as the default again keeps the origin; changing the default sets it to user', () => {
    const prefs = getProviderPrefs({
      providers: [legacyCompatible],
      defaultProviderId: 'acct:legacy',
      defaultProviderOrigin: 'converted',
    })
    expect(prefs.defaultProviderOrigin).toBe('converted')
    expect(applyLegacyProviderUpdate({ prefs, update: oldBody, deps }).defaultProviderOrigin).toBe('converted')
    const other = { ...legacyCompatible, id: 'acct:other' }
    const elsewhere = getProviderPrefs({
      providers: [legacyCompatible, other],
      defaultProviderId: 'acct:other',
      defaultProviderOrigin: 'converted',
    })
    expect(applyLegacyProviderUpdate({ prefs: elsewhere, update: oldBody, deps })).toMatchObject({
      defaultProviderId: 'acct:legacy',
      defaultProviderOrigin: 'user',
    })
  })

  test('turning AI off (level 0) does not save the provider, even with enabled true and an incomplete one', () => {
    const prefs = getProviderPrefs(null)
    const update = { featuresEnabled: false, enabled: true, provider: 'openai-compatible' }
    expect(applyLegacyProviderUpdate({ prefs, update, deps })).toBe(prefs)
  })

  test('a padded typed key is trimmed before encryption', () => {
    const saved = applyLegacyProviderUpdate({
      prefs: getProviderPrefs(null),
      update: { ...oldBody, apiKey: '  sk-1  ' },
      deps,
    })
    expect(saved.providers[0].apiKeyEncrypted).toBe('enc:sk-1')
  })

  test('a typed key without a server secret answers 409 aiEncryptionMissing', async () => {
    const noSecret = { ...deps, isEncryptionConfigured: () => false }
    const error: any = await expectSystemErrorKey(
      () =>
        applyLegacyProviderUpdate({
          prefs: getProviderPrefs(null),
          update: { ...oldBody, apiKey: 'sk-1' },
          deps: noSecret,
        }),
      'aiEncryptionMissing'
    )
    expect(error.statusCode).toBe(409)
  })

  test('a PUT without enabled (new panel) leaves the providers alone', () => {
    const prefs = getProviderPrefs({ providers: [legacyCompatible], defaultProviderId: 'acct:legacy' })
    expect(applyLegacyProviderUpdate({ prefs, update: { accessLevel: 2, featureToggles: {} }, deps })).toBe(prefs)
  })

  test('the old PUT keeps the key only on the same endpoint', () => {
    const withKey = applyLegacyProviderUpdate({
      prefs: getProviderPrefs(null),
      update: { ...oldBody, apiKey: 'sk-1' },
      deps,
    })
    expect(withKey.providers[0].apiKeyEncrypted).toBe('enc:sk-1')
    const sameEndpoint = applyLegacyProviderUpdate({ prefs: withKey, update: { ...oldBody, model: 'other' }, deps })
    expect(sameEndpoint.providers[0]).toMatchObject({ model: 'other', apiKeyEncrypted: 'enc:sk-1' })
    const moved = applyLegacyProviderUpdate({
      prefs: withKey,
      update: { ...oldBody, baseUrl: 'https://elsewhere.example.org/v1' },
      deps,
    })
    expect(moved.providers[0].apiKeyEncrypted).toBeNull()
    const cleared = applyLegacyProviderUpdate({ prefs: withKey, update: { ...oldBody, apiKey: '' }, deps })
    expect(cleared.providers[0].apiKeyEncrypted).toBeNull()
  })

  test('the old PUT validates like before', async () => {
    const prefs = getProviderPrefs(null)
    await expectSystemErrorKey(
      () => applyLegacyProviderUpdate({ prefs, update: { ...oldBody, provider: 'nope' }, deps }),
      'aiProviderInvalid'
    )
    await expectSystemErrorKey(
      () => applyLegacyProviderUpdate({ prefs, update: { ...oldBody, model: ' ' }, deps }),
      'aiModelMissing'
    )
    await expectSystemErrorKey(
      () => applyLegacyProviderUpdate({ prefs, update: { ...oldBody, baseUrl: '' }, deps }),
      'aiBaseUrlMissing'
    )
  })

  test('removing the personal provider drops acct:legacy only and resets its default', () => {
    const other = { ...legacyCompatible, id: 'acct:other' }
    const prefs = getProviderPrefs({ providers: [legacyCompatible, other], defaultProviderId: 'acct:legacy' })
    expect(removeLegacyProvider(prefs)).toEqual({
      defaultProviderId: 'arena-default',
      defaultProviderOrigin: 'user',
      providers: [other],
    })
    const otherDefault = getProviderPrefs({ providers: [legacyCompatible, other], defaultProviderId: 'acct:other' })
    expect(removeLegacyProvider(otherDefault).defaultProviderId).toBe('acct:other')
  })

  test('a null or blank apiKey is "not sent" and keeps the key; the empty string clears it', () => {
    const withKey = applyLegacyProviderUpdate({
      prefs: getProviderPrefs(null),
      update: { ...oldBody, apiKey: 'sk-1' },
      deps,
    })
    for (const apiKey of [null, '   ', 42]) {
      const kept = applyLegacyProviderUpdate({ prefs: withKey, update: { ...oldBody, apiKey }, deps })
      expect(kept.providers[0].apiKeyEncrypted).toBe('enc:sk-1')
    }
    const spaced = applyLegacyProviderUpdate({
      prefs: withKey,
      update: { ...oldBody, baseUrl: ' https://models.example.org/v1/ ' },
      deps,
    })
    expect(spaced.providers[0].apiKeyEncrypted).toBe('enc:sk-1')
  })

  test('the old panel test and model list answer 409 for an unreadable stored key, also with apiKey null', async () => {
    const user = {
      uuid: 'u1',
      prefs: { ai: { ...oldBody, provider: 'openai', baseUrl: null, apiKeyEncrypted: 'not:a:key' } },
    }
    await expectSystemErrorKey(() => testConnection({ user, apiKey: null } as any), 'aiApiKeyUnreadable')
    await expectSystemErrorKey(
      () => listModels({ user, provider: 'openai', apiKey: null } as any),
      'aiApiKeyUnreadable'
    )
  })

  test('the GET carries the list and the old flat fields', () => {
    const settings = getPublicSettings({
      uuid: 'u1',
      prefs: { ai: { featuresEnabled: true, featureToggles: { chat: true }, ...oldBody } },
    })
    expect(settings).toMatchObject({
      accessLevel: 1,
      featuresEnabled: true,
      defaultProviderId: 'acct:legacy',
      defaultProviderOrigin: 'converted',
      provider: 'openai-compatible',
      model: 'remote-model',
      baseUrl: 'https://models.example.org/v1',
      enabled: true,
      hasApiKey: false,
      apiKeyReadable: false,
    })
    expect(settings.providers).toEqual([
      {
        id: 'acct:legacy',
        type: 'openai-compatible',
        name: 'OpenAI-compatible',
        model: 'remote-model',
        baseUrl: 'https://models.example.org/v1',
        hostingClass: 'cloud',
        hasApiKey: false,
        apiKeyReadable: false,
        lastTestOk: null,
        lastTestAt: null,
      },
    ])
    expect(getPublicSettings({ uuid: 'u1', prefs: {} })).toMatchObject({
      accessLevel: 0,
      featuresEnabled: false,
      defaultProviderId: 'arena-default',
      providers: [],
      provider: null,
      enabled: false,
    })
  })
})
