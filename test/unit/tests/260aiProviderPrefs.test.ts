import {
  ARENA_DEFAULT_PROVIDER_ID,
  getAiProviderKind,
  getDefaultProviderName,
  isAccountProviderId,
  isAiProviderId,
  isLocalProviderId,
  normalizeProviderName,
} from '@common/ai/providerIds'
import {
  findStoredProvider,
  getProviderPrefs,
  isSameEndpoint,
  providerTypeUsesBaseUrl,
  toPublicProvider,
  withProviderPrefs,
} from '@server/modules/ai/service/aiProviderPrefs'

const legacySlot = {
  accessLevel: 2,
  featuresEnabled: true,
  featureToggles: { chat: true },
  provider: 'openai',
  model: 'gpt-x',
  baseUrl: null,
  apiKeyEncrypted: 'v1:abc',
  enabled: true,
  lastTestOk: true,
  lastTestAt: '2026-10-01T00:00:00.000Z',
}

const legacyProvider = {
  id: 'acct:legacy',
  type: 'openai',
  name: 'OpenAI',
  model: 'gpt-x',
  baseUrl: null,
  apiKeyEncrypted: 'v1:abc',
  lastTestOk: true,
  lastTestAt: '2026-10-01T00:00:00.000Z',
}

describe('AI provider ids and stored list (260)', () => {
  test('ids are typed by prefix', () => {
    expect(isAiProviderId('arena-default')).toBe(true)
    expect(isAccountProviderId('acct:legacy')).toBe(true)
    expect(isAccountProviderId('acct:6f1c2d3e-0000-4000-8000-000000000001')).toBe(true)
    expect(isLocalProviderId('local:legacy')).toBe(true)
    expect(isAccountProviderId('local:legacy')).toBe(false)
    for (const value of ['acct:', 'acct:../x', 'local:a b', 'other:1', '', null, 42, `acct:${'a'.repeat(65)}`]) {
      expect([value, isAiProviderId(value)]).toEqual([value, false])
    }
    expect(getAiProviderKind('arena-default')).toBe('arenaDefault')
    expect(getAiProviderKind('acct:legacy')).toBe('account')
    expect(getAiProviderKind('local:legacy')).toBe('local')
    expect(getAiProviderKind('nope')).toBeNull()
  })

  test('names default to the type and are cleaned', () => {
    expect(getDefaultProviderName('local')).toBe('Local server')
    expect(getDefaultProviderName('anthropic')).toBe('Anthropic')
    expect(getDefaultProviderName('openai-compatible')).toBe('OpenAI-compatible')
    expect(normalizeProviderName('  My   GPU  ', 'local')).toBe('My GPU')
    expect(normalizeProviderName('', 'openai')).toBe('OpenAI')
    expect(normalizeProviderName(42, 'google')).toBe('Google')
    expect(normalizeProviderName('x'.repeat(100), 'openai')).toHaveLength(60)
  })

  test('endpoints compare without trailing slashes; only some types use a base URL', () => {
    expect(isSameEndpoint('https://llm.example.org/v1/', 'https://llm.example.org/v1')).toBe(true)
    expect(isSameEndpoint(null, '')).toBe(true)
    expect(isSameEndpoint('https://llm.example.org/v1', 'https://evil.example.com/v1')).toBe(false)
    expect(providerTypeUsesBaseUrl('openai-compatible')).toBe(true)
    expect(providerTypeUsesBaseUrl('vercel-ai-sdk')).toBe(true)
    expect(providerTypeUsesBaseUrl('openai')).toBe(false)
  })

  test('nothing stored: no providers, Arena default, converted origin', () => {
    const empty = { defaultProviderId: ARENA_DEFAULT_PROVIDER_ID, defaultProviderOrigin: 'converted', providers: [] }
    expect(getProviderPrefs(null)).toEqual(empty)
    expect(getProviderPrefs({ accessLevel: 1, featuresEnabled: true })).toEqual(empty)
  })

  test('the old slot converts to acct:legacy, the default when it was enabled', () => {
    expect(getProviderPrefs(legacySlot)).toEqual({
      defaultProviderId: 'acct:legacy',
      defaultProviderOrigin: 'converted',
      providers: [legacyProvider],
    })
    // stable: every read gives the same id, so defaults and conversations that point to it stay valid
    expect(getProviderPrefs(legacySlot).providers[0].id).toBe('acct:legacy')
    expect(getProviderPrefs({ ...legacySlot, enabled: false }).defaultProviderId).toBe('arena-default')
    expect(getProviderPrefs({ ...legacySlot, provider: 'nope' }).providers).toEqual([])
    expect(getProviderPrefs({ ...legacySlot, model: null }).providers).toEqual([])
    expect(
      getProviderPrefs({ ...legacySlot, provider: 'vercel-ai-sdk', model: null, baseUrl: 'https://agent.example.org' })
        .providers[0]
    ).toMatchObject({ type: 'vercel-ai-sdk', model: 'vercel-ai-sdk', baseUrl: 'https://agent.example.org' })
  })

  test('a stored list is sanitised: bad entries dropped, duplicates removed, a missing default reset', () => {
    const prefs = getProviderPrefs({
      defaultProviderId: 'acct:gone',
      defaultProviderOrigin: 'user',
      providers: [
        {
          id: 'acct:a',
          type: 'anthropic',
          name: ' Work ',
          model: 'claude',
          baseUrl: 'ignored',
          apiKeyEncrypted: 'v1:k',
        },
        { id: 'acct:a', type: 'openai', name: 'duplicate', model: 'm' },
        { id: 'local:b', type: 'openai', name: 'local ids never live on the account', model: 'm' },
        { id: 'acct:c', type: 'bogus', model: 'm' },
        'not an object',
      ],
    })
    expect(prefs.providers).toEqual([
      {
        id: 'acct:a',
        type: 'anthropic',
        name: 'Work',
        model: 'claude',
        baseUrl: null,
        apiKeyEncrypted: 'v1:k',
        lastTestOk: null,
        lastTestAt: null,
      },
    ])
    expect(prefs.defaultProviderId).toBe('arena-default')
    expect(prefs.defaultProviderOrigin).toBe('user')
    // a local default is kept: it lives in a browser, the server cannot check it
    const local = getProviderPrefs({ providers: [], defaultProviderId: 'local:xyz' })
    expect(local).toMatchObject({ defaultProviderId: 'local:xyz', defaultProviderOrigin: 'converted' })
  })

  test('writing the list drops the old slot and keeps the access fields', () => {
    const written = withProviderPrefs(legacySlot, getProviderPrefs(legacySlot))
    expect(written).toEqual({
      accessLevel: 2,
      featuresEnabled: true,
      featureToggles: { chat: true },
      defaultProviderId: 'acct:legacy',
      defaultProviderOrigin: 'converted',
      providers: [legacyProvider],
    })
    // the written prefs read back the same
    expect(getProviderPrefs(written)).toEqual(getProviderPrefs(legacySlot))
    expect(withProviderPrefs(null, getProviderPrefs(null))).toEqual({
      defaultProviderId: 'arena-default',
      defaultProviderOrigin: 'converted',
      providers: [],
    })
  })

  test('the public entry never carries the key', () => {
    const stored = findStoredProvider(getProviderPrefs(legacySlot), 'acct:legacy')!
    const entry = toPublicProvider({ provider: stored, hostingClass: 'cloud', apiKeyReadable: true })
    expect(entry).toEqual({
      id: 'acct:legacy',
      type: 'openai',
      name: 'OpenAI',
      model: 'gpt-x',
      baseUrl: null,
      hostingClass: 'cloud',
      hasApiKey: true,
      apiKeyReadable: true,
      lastTestOk: true,
      lastTestAt: '2026-10-01T00:00:00.000Z',
    })
    expect(JSON.stringify(entry)).not.toContain('v1:abc')
    expect(findStoredProvider(getProviderPrefs(legacySlot), 'acct:other')).toBeNull()
  })
})
