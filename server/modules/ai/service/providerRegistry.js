/**
 * Thin factories that turn a provider config object into a Vercel AI SDK
 * model handle. Centralised here so that adding a provider (e.g. Mistral)
 * is a one-liner without touching the resolver or model client.
 *
 * The `openai-compatible` case routes to `@ai-sdk/openai`'s `createOpenAI`
 * with a custom `baseURL`, which transparently covers Azure OpenAI,
 * OpenRouter, Together, Groq, Fireworks, Ollama, LM Studio, vLLM, and any
 * other endpoint that speaks the OpenAI HTTP protocol.
 *
 * The `vercel-ai-sdk` case targets a custom backend that speaks the Vercel
 * AI SDK v5 chat protocol (messages + parts body, typed SSE stream).
 */
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'

import SystemError from '@core/systemError'

import { createVercelAiSdkModel } from './vercelAiSdkProvider'

export const providers = {
  openai: 'openai',
  anthropic: 'anthropic',
  google: 'google',
  openaiCompatible: 'openai-compatible',
  vercelAiSdk: 'vercel-ai-sdk',
}

// Providers whose endpoint is a fixed agent rather than a generic LLM
// API. They have no concept of a user-chosen model, so the registry skips
// the usual model-required validation.
const FIXED_ENDPOINT_PROVIDERS = new Set(['vercel-ai-sdk'])

const validProviders = new Set(Object.values(providers))

/**
 * Returns true when `provider` is a recognised gateway provider key.
 * @param {string} provider - Provider identifier from config or env.
 * @returns {boolean} True when supported.
 */
export const isSupported = (provider) => validProviders.has(provider)

/**
 * Builds a Vercel AI SDK `LanguageModel` instance for the given config.
 * Throws a `SystemError` with key `aiProviderInvalid` for unknown providers
 * or `aiApiKeyMissing` when a required API key is absent.
 * @param {object} cfg - Resolved provider configuration.
 * @param {string} cfg.provider - One of {@link providers}.
 * @param {string} cfg.model - Model identifier (e.g. "gpt-4o-mini").
 * @param {string} [cfg.apiKey] - API key (required for cloud providers; optional for
 *   keyless local OpenAI-compatible servers like a default Ollama).
 * @param {string} [cfg.baseUrl] - Custom base URL (only meaningful for
 *   {@link providers.openaiCompatible}).
 * @returns {object} A Vercel AI SDK language model handle ready to pass to
 *   `generateText` / `generateObject` / `streamText`.
 */
export const buildModel = (cfg) => {
  const { provider, model, apiKey, baseUrl } = cfg
  if (!isSupported(provider)) {
    throw new SystemError('aiProviderInvalid', { provider })
  }
  if (!model && !FIXED_ENDPOINT_PROVIDERS.has(provider)) {
    throw new SystemError('aiModelMissing', { provider })
  }

  switch (provider) {
    case providers.openai: {
      if (!apiKey) throw new SystemError('aiApiKeyMissing', { provider })
      return createOpenAI({ apiKey })(model)
    }
    case providers.anthropic: {
      if (!apiKey) throw new SystemError('aiApiKeyMissing', { provider })
      return createAnthropic({ apiKey })(model)
    }
    case providers.google: {
      if (!apiKey) throw new SystemError('aiApiKeyMissing', { provider })
      return createGoogleGenerativeAI({ apiKey })(model)
    }
    case providers.openaiCompatible: {
      if (!baseUrl) throw new SystemError('aiBaseUrlMissing', { provider })
      // apiKey is optional for some local servers (e.g. Ollama with no auth)
      return createOpenAI({ apiKey: apiKey || 'not-used', baseURL: baseUrl })(model)
    }
    case providers.vercelAiSdk: {
      if (!baseUrl) throw new SystemError('aiBaseUrlMissing', { provider })
      return createVercelAiSdkModel({ baseUrl })
    }
    default:
      throw new SystemError('aiProviderInvalid', { provider })
  }
}
