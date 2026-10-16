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
import type { LanguageModelV4 } from '@ai-sdk/provider'

import { ENV } from '@core/processUtils'
import SystemError from '@core/systemError'

import { AiProvider } from '@common/ai/aiProvider'
import { assertProviderBaseUrlAllowed, type GuardOptions } from './baseUrlGuard'
import { createGuardedFetch, DEFAULT_MAX_BODY_BYTES } from './guardedFetch'
import { createMockModel, MOCK_PROVIDER } from './mockProvider'
import { createResponseLimitedFetch, getProviderResponseLimits } from './responseLimits'
import { createVercelAiSdkModel } from './vercelAiSdkProvider'

export const providers = AiProvider

/**
 * Resolved provider configuration: what the registry needs to build a model handle.
 */
export type ProviderConfig = {
  provider: string
  model?: string | null
  apiKey?: string | null
  baseUrl?: string | null
}

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

// Providers whose endpoint is a fixed agent rather than a generic LLM
// API. They have no concept of a user-chosen model, so the registry skips
// the usual model-required validation.
const FIXED_ENDPOINT_PROVIDERS = new Set<string>([AiProvider.vercelAiSdk])

const validProviders = new Set<string>(Object.values(providers))

/**
 * Returns true when `provider` is a recognised gateway provider key.
 * @param {string} provider - Provider identifier from config or env.
 * @returns {boolean} True when supported.
 */
export const isSupported = (provider: string): boolean => validProviders.has(provider)

/**
 * Fetch that rejects redirects: the base URL guard checks the host once, so a 3xx to an internal address would bypass it.
 * @param {RequestInfo | URL} input - Request URL.
 * @param {RequestInit} [init] - Fetch options.
 * @returns {Promise<Response>} The response.
 */
const noRedirectFetch: FetchLike = (input, init) => fetch(input, { ...init, redirect: 'error' })

/**
 * Returns the cap of a provider answer: it follows the output tokens the server allows, so a legitimate long answer is
 * not cut.
 * @returns {number} The cap, in bytes.
 */
const getMaxResponseBytes = () => getProviderResponseLimits(ENV.aiMaxOutputTokens).maxResponseBytes

/**
 * Caps the answers of a custom endpoint: the endpoint of a user must not fill the memory with an endless answer. It
 * sits on top of the fetch it wraps (the connect-time guard of a user endpoint, see {@link buildUserModel}).
 * @param {FetchLike} fetchImpl - The fetch to wrap.
 * @returns {FetchLike} The capped fetch.
 */
const withResponseLimit = (fetchImpl: FetchLike): FetchLike =>
  createResponseLimitedFetch(fetchImpl, getMaxResponseBytes())

/**
 * Builds a Vercel AI SDK `LanguageModelV4` instance for the given config.
 * Throws a `SystemError` with key `aiProviderInvalid` for unknown providers
 * or `aiApiKeyMissing` when a required API key is absent.
 * @param {ProviderConfig} cfg - Resolved provider configuration.
 * @param {string} cfg.provider - One of {@link providers}.
 * @param {string} cfg.model - Model identifier (e.g. "gpt-4o-mini").
 * @param {string} [cfg.apiKey] - API key (required for cloud providers; optional for
 *   keyless local OpenAI-compatible servers like a default Ollama).
 * @param {string} [cfg.baseUrl] - Custom base URL (only meaningful for
 *   {@link providers.openaiCompatible}).
 * @param {object} [options] - Options.
 * @param {FetchLike} [options.fetchImpl] - Fetch of the calls to a custom base URL (default: the global one without
 *   redirects; the endpoint of a user is called with a guarded fetch, see {@link buildUserModel}). Its answers are
 *   capped by the output token limit of the server.
 * @returns {LanguageModelV4} A Vercel AI SDK language model handle ready to pass to
 *   `generateText` / `generateObject` / `streamText`.
 */
export const buildModel = (cfg: ProviderConfig, { fetchImpl }: { fetchImpl?: FetchLike } = {}): LanguageModelV4 => {
  const { provider, model, apiKey, baseUrl } = cfg
  // test servers only: canned answers, no network (e2e)
  if (provider === MOCK_PROVIDER && ENV.aiMockProviderEnabled) return createMockModel()
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
      // Use .chat() explicitly — the default call now routes to the OpenAI Responses API
      // (/v1/responses), which most OpenAI-compatible providers don't implement.
      return createOpenAI({
        apiKey: apiKey || 'not-used',
        baseURL: baseUrl,
        fetch: withResponseLimit(fetchImpl ?? noRedirectFetch),
      }).chat(model)
    }
    case providers.vercelAiSdk: {
      if (!baseUrl) throw new SystemError('aiBaseUrlMissing', { provider })
      return createVercelAiSdkModel({ baseUrl, fetchImpl: withResponseLimit(fetchImpl ?? noRedirectFetch) })
    }
    default:
      throw new SystemError('aiProviderInvalid', { provider })
  }
}

/**
 * Builds the model for a user-supplied config, refusing base URLs that point to internal addresses: before the call,
 * and again when the call connects (the guarded fetch).
 * @param {ProviderConfig} cfg - User provider config (see buildModel).
 * @param {GuardOptions} [guardOptions] - Options for the base URL guard (tests).
 * @returns {Promise<LanguageModelV4>} The model handle.
 */
export const buildUserModel = async (
  cfg: ProviderConfig,
  guardOptions?: GuardOptions & { maxBodyBytes?: number }
): Promise<LanguageModelV4> => {
  await assertProviderBaseUrlAllowed(cfg, guardOptions)
  // the guard's own body cap is only a backstop: it never cuts below the per-model cap that buildModel puts on top
  const maxBodyBytes = Math.max(DEFAULT_MAX_BODY_BYTES, getMaxResponseBytes())
  return buildModel(cfg, { fetchImpl: createGuardedFetch({ maxBodyBytes, ...guardOptions }) })
}
