/**
 * Pure-logic tests for the AI provider registry. We only verify config
 * validation here — actually constructing a Vercel AI SDK model handle is
 * a black-box call into `@ai-sdk/*` and is exercised by integration tests.
 */
import * as ProviderRegistry from '@server/modules/ai/service/providerRegistry'

describe('AI provider registry', () => {
  describe('isSupported', () => {
    test.each([
      ['openai', true],
      ['anthropic', true],
      ['google', true],
      ['openai-compatible', true],
      ['vercel-ai-sdk', true],
      ['', false],
      ['mistral', false],
      [null, false],
      [undefined, false],
    ])('isSupported(%p) === %p', (provider, expected) => {
      expect(ProviderRegistry.isSupported(provider)).toBe(expected)
    })
  })

  describe('buildModel — validation paths', () => {
    test('throws aiProviderInvalid for unknown provider', () => {
      expect(() => ProviderRegistry.buildModel({ provider: 'mistral', model: 'm', apiKey: 'k' })).toThrow(
        /aiProviderInvalid/
      )
    })

    test('throws aiModelMissing when model is empty', () => {
      expect(() => ProviderRegistry.buildModel({ provider: 'openai', model: '', apiKey: 'k' })).toThrow(
        /aiModelMissing/
      )
    })

    test('throws aiApiKeyMissing for openai without key', () => {
      expect(() => ProviderRegistry.buildModel({ provider: 'openai', model: 'gpt-4o-mini' })).toThrow(/aiApiKeyMissing/)
    })

    test('throws aiApiKeyMissing for anthropic without key', () => {
      expect(() => ProviderRegistry.buildModel({ provider: 'anthropic', model: 'claude-haiku-4-5' })).toThrow(
        /aiApiKeyMissing/
      )
    })

    test('throws aiApiKeyMissing for google without key', () => {
      expect(() => ProviderRegistry.buildModel({ provider: 'google', model: 'gemini-2.0-flash-exp' })).toThrow(
        /aiApiKeyMissing/
      )
    })

    test('throws aiBaseUrlMissing for openai-compatible without baseUrl', () => {
      expect(() =>
        ProviderRegistry.buildModel({ provider: 'openai-compatible', model: 'llama3', apiKey: 'k' })
      ).toThrow(/aiBaseUrlMissing/)
    })

    test('throws aiBaseUrlMissing for vercel-ai-sdk without baseUrl', () => {
      expect(() => ProviderRegistry.buildModel({ provider: 'vercel-ai-sdk' })).toThrow(/aiBaseUrlMissing/)
    })

    test('does NOT require a model for vercel-ai-sdk (fixed-endpoint provider)', () => {
      expect(() =>
        ProviderRegistry.buildModel({ provider: 'vercel-ai-sdk', baseUrl: 'https://example.com/api/chat' })
      ).not.toThrow(/aiModelMissing/)
    })
  })

  describe('buildModel — happy path', () => {
    test('returns a model handle for openai with key', () => {
      const m = ProviderRegistry.buildModel({ provider: 'openai', model: 'gpt-4o-mini', apiKey: 'sk-x' })
      expect(m).toBeDefined()
    })

    test('returns a model handle for openai-compatible with baseUrl and no key', () => {
      const m = ProviderRegistry.buildModel({
        provider: 'openai-compatible',
        model: 'llama3.3:70b',
        baseUrl: 'http://localhost:11434/v1',
      })
      expect(m).toBeDefined()
    })

    test('returns a model handle for anthropic with key', () => {
      const m = ProviderRegistry.buildModel({
        provider: 'anthropic',
        model: 'claude-haiku-4-5',
        apiKey: 'sk-ant-x',
      })
      expect(m).toBeDefined()
    })

    test('returns a model handle for vercel-ai-sdk with only a baseUrl', () => {
      const m = ProviderRegistry.buildModel({
        provider: 'vercel-ai-sdk',
        baseUrl: 'https://example.com/api/chat',
      })
      expect(m).toBeDefined()
      expect(m.provider).toBe('vercel-ai-sdk')
    })
  })

  describe('providers constant exposes the supported keys', () => {
    test('exposes openai, anthropic, google, openaiCompatible, vercelAiSdk', () => {
      expect(ProviderRegistry.providers).toEqual({
        openai: 'openai',
        anthropic: 'anthropic',
        google: 'google',
        openaiCompatible: 'openai-compatible',
        vercelAiSdk: 'vercel-ai-sdk',
      })
    })
  })
})
