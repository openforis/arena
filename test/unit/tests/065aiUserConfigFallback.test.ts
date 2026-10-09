import * as AiSettingsService from '@server/modules/ai/service/aiSettingsService'
import * as ProviderResolver from '@server/modules/ai/service/providerResolver'
import * as SecretBox from '@server/utils/crypto/secretBox'

const KEY_A = 'a'.repeat(64)
const KEY_B = 'b'.repeat(64)

const userWithKey = (apiKeyEncrypted: string) =>
  ({
    uuid: 'user-1',
    prefs: {
      ai: {
        featuresEnabled: true,
        enabled: true,
        provider: 'openai',
        model: 'gpt-x',
        apiKeyEncrypted,
      },
    },
  }) as any

const adminConfig = { provider: 'openai-compatible', model: 'admin-model', baseUrl: 'http://admin', apiKey: null }

describe('saved API key encrypted with a rotated secret', () => {
  let originalKey: string | undefined
  let encrypted: string

  beforeAll(() => {
    originalKey = process.env.AI_USER_KEY_ENCRYPTION_SECRET
    process.env.AI_USER_KEY_ENCRYPTION_SECRET = KEY_A
    encrypted = SecretBox.encrypt('sk-user')
    process.env.AI_USER_KEY_ENCRYPTION_SECRET = KEY_B // rotation
  })

  afterAll(() => {
    if (originalKey === undefined) delete process.env.AI_USER_KEY_ENCRYPTION_SECRET
    else process.env.AI_USER_KEY_ENCRYPTION_SECRET = originalKey
  })

  test('the user config is ignored instead of throwing', () => {
    expect(AiSettingsService.getEffectiveUserConfig(userWithKey(encrypted))).toBeNull()
  })

  test('the public settings still load and flag the key as unreadable', () => {
    const settings = AiSettingsService.getPublicSettings(userWithKey(encrypted))
    expect(settings.hasApiKey).toBe(true)
    expect(settings.apiKeyReadable).toBe(false)
  })

  test('the resolver falls back to the admin default', () => {
    expect(ProviderResolver.resolveConfigForUser(userWithKey(encrypted), adminConfig)).toEqual({
      cfg: adminConfig,
      source: ProviderResolver.sources.adminDefault,
    })
  })

  test('a readable key is used', () => {
    const readable = SecretBox.encrypt('sk-new')
    expect(AiSettingsService.getEffectiveUserConfig(userWithKey(readable))?.apiKey).toBe('sk-new')
    expect(AiSettingsService.getPublicSettings(userWithKey(readable)).apiKeyReadable).toBe(true)
    expect(ProviderResolver.resolveConfigForUser(userWithKey(readable), adminConfig)?.source).toBe(
      ProviderResolver.sources.user
    )
  })

  test('no config at all resolves to null', () => {
    expect(ProviderResolver.resolveConfigForUser({ uuid: 'u', prefs: {} } as any, null)).toBeNull()
  })
})
