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

import { AiProvider } from '@common/ai/aiProvider'
import { createVercelAiSdkModel } from './vercelAiSdkProvider'
import { buildVertexModel } from './vertexAi'

export const providers = AiProvider

// Providers whose endpoint is a fixed agent rather than a generic LLM
// API. They have no concept of a user-chosen model, so the registry skips
// the usual model-required validation.
const FIXED_ENDPOINT_PROVIDERS = new Set([AiProvider.vercelAiSdk])

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
 * @param {string} [cfg.project] - Google Cloud project (Vertex AI only).
 * @param {string} [cfg.location] - Google Cloud location (Vertex AI only).
 * @param {boolean} [cfg.useApplicationDefaultCredentials] - Vertex AI only: allow the server
 *   Application Default Credentials when no credential is set (admin default config only).
 * @returns {object} A Vercel AI SDK language model handle ready to pass to
 *   `generateText` / `generateObject` / `streamText`.
 */
export const buildModel = (cfg) => {
  const { provider, model, apiKey, baseUrl, project, location, useApplicationDefaultCredentials } = cfg
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
    case providers.googleVertex:
      return buildVertexModel({ model, apiKey, project, location, useApplicationDefaultCredentials })
    case providers.openaiCompatible: {
      if (!baseUrl) throw new SystemError('aiBaseUrlMissing', { provider })
      // apiKey is optional for some local servers (e.g. Ollama with no auth)
      // Use .chat() explicitly — the default call now routes to the OpenAI Responses API
      // (/v1/responses), which most OpenAI-compatible providers don't implement.
      return createOpenAI({ apiKey: apiKey || 'not-used', baseURL: baseUrl }).chat(model)
    }
    case providers.vercelAiSdk: {
      if (!baseUrl) throw new SystemError('aiBaseUrlMissing', { provider })
      return createVercelAiSdkModel({ baseUrl })
    }
    default:
      throw new SystemError('aiProviderInvalid', { provider })
  }
}
