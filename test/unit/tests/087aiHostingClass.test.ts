import { getProviderHostingClass } from '@server/modules/ai/service/hostingClass'
import * as ProviderResolver from '@server/modules/ai/service/providerResolver'

const allowlist = ['http://llm.org.internal:1234/v1', 'https://ai.example.org']

describe('getProviderHostingClass', () => {
  test.each([
    ['openai-compatible, allowlisted', 'openai-compatible', 'http://llm.org.internal:1234/v1', 'orgHosted'],
    ['openai-compatible, allowlisted sub-path', 'openai-compatible', 'https://ai.example.org/api/v1', 'orgHosted'],
    ['vercel-ai-sdk, allowlisted', 'vercel-ai-sdk', 'https://ai.example.org/chat', 'orgHosted'],
    ['openai-compatible, not allowlisted', 'openai-compatible', 'https://openrouter.ai/api/v1', 'cloud'],
    [
      'openai-compatible, path outside the allowed prefix',
      'openai-compatible',
      'http://llm.org.internal:1234/v10',
      'cloud',
    ],
    ['openai-compatible, invalid URL', 'openai-compatible', 'not a url', 'cloud'],
    ['openai-compatible, no URL', 'openai-compatible', null, 'cloud'],
    ['built-in provider, even with an allowlisted URL', 'openai', 'https://ai.example.org', 'cloud'],
    ['anthropic', 'anthropic', undefined, 'cloud'],
    ['google', 'google', undefined, 'cloud'],
    ['mock provider', 'mock', undefined, 'cloud'],
  ])('%s', (_label, provider, baseUrl, expected) => {
    expect(getProviderHostingClass({ provider, baseUrl, allowlist })).toBe(expected)
  })

  test('an empty allowlist classifies everything as cloud', () => {
    expect(
      getProviderHostingClass({
        provider: 'openai-compatible',
        baseUrl: 'http://llm.org.internal:1234/v1',
        allowlist: [],
      })
    ).toBe('cloud')
  })
})

describe('ProviderResolver.describeResolvedConfig', () => {
  test('user config on the allowlist is orgHosted', () => {
    const resolved = {
      cfg: { provider: 'openai-compatible', model: 'local-model', baseUrl: 'http://llm.org.internal:1234/v1' },
      source: ProviderResolver.sources.user,
    }
    expect(ProviderResolver.describeResolvedConfig(resolved, allowlist)).toEqual({
      source: 'user',
      provider: 'openai-compatible',
      model: 'local-model',
      hostingClass: 'orgHosted',
    })
  })

  test('admin default is classified the same way (not allowlisted → cloud)', () => {
    const resolved = {
      cfg: { provider: 'openai-compatible', model: 'm', baseUrl: 'http://10.0.0.8/v1' },
      source: ProviderResolver.sources.adminDefault,
    }
    expect(ProviderResolver.describeResolvedConfig(resolved, allowlist).hostingClass).toBe('cloud')
  })

  test('no config → all null', () => {
    expect(ProviderResolver.describeResolvedConfig(null, allowlist)).toEqual({
      source: null,
      provider: null,
      model: null,
      hostingClass: null,
    })
  })
})
