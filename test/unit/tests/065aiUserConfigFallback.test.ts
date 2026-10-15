import { buildKeyAad } from '@server/modules/ai/service/aiProviderPrefs'
import * as AiSettingsService from '@server/modules/ai/service/aiSettingsService'
import * as ProviderResolver from '@server/modules/ai/service/providerResolver'
import * as SecretBox from '@server/utils/crypto/secretBox'
import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'

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

// the old single slot is the provider acct:legacy of the user
const legacySlotAad = buildKeyAad({
  userUuid: 'user-1',
  provider: { id: 'acct:legacy', type: 'openai', baseUrl: null },
})

const adminConfig = { provider: 'openai-compatible', model: 'admin-model', baseUrl: 'http://admin', apiKey: null }

describe('saved API key encrypted with a rotated secret', () => {
  let originalKey: string | undefined
  let encrypted: string

  beforeAll(() => {
    originalKey = process.env.AI_USER_KEY_ENCRYPTION_SECRET
    process.env.AI_USER_KEY_ENCRYPTION_SECRET = KEY_A
    encrypted = SecretBox.encrypt('sk-user', legacySlotAad)
    process.env.AI_USER_KEY_ENCRYPTION_SECRET = KEY_B // rotation
  })

  afterAll(() => {
    if (originalKey === undefined) delete process.env.AI_USER_KEY_ENCRYPTION_SECRET
    else process.env.AI_USER_KEY_ENCRYPTION_SECRET = originalKey
  })

  test('the public settings still load and flag the key as unreadable', () => {
    const settings = AiSettingsService.getPublicSettings(userWithKey(encrypted))
    expect(settings.providers[0]).toMatchObject({ id: 'acct:legacy', hasApiKey: true, apiKeyReadable: false })
  })

  test('the resolver refuses the provider instead of switching to the admin default', async () => {
    const error: any = await expectSystemErrorKey(
      () => ProviderResolver.resolveProviderConfig({ user: userWithKey(encrypted), adminConfig }),
      'aiApiKeyUnreadable'
    )
    expect(error.statusCode).toBe(409)
  })

  test('a readable key is used', () => {
    const readable = SecretBox.encrypt('sk-new', legacySlotAad)
    expect(AiSettingsService.getPublicSettings(userWithKey(readable)).providers[0].apiKeyReadable).toBe(true)
    expect(ProviderResolver.resolveProviderConfig({ user: userWithKey(readable), adminConfig })).toMatchObject({
      source: ProviderResolver.sources.user,
      providerId: 'acct:legacy',
      cfg: { apiKey: 'sk-new' },
    })
  })

  test('no config at all is aiNotConfigured', async () => {
    await expectSystemErrorKey(
      () => ProviderResolver.resolveProviderConfig({ user: { uuid: 'u', prefs: {} } as any, adminConfig: null }),
      'aiNotConfigured'
    )
  })
})
