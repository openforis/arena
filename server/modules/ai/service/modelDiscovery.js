/**
 * Provider-side `/models` discovery used by the AI Settings panel to turn
 * the free-text Model field into a populated dropdown.
 *
 * Each provider has its own list endpoint, auth scheme, and response
 * shape. This module normalises them all into `{ id, description? }`
 * descriptors and trims the per-provider clutter (audio, embedding,
 * moderation, image models) where we can identify it cheaply.
 *
 * On any failure (network, auth, parse) we surface an error key with a status code: nothing the provider or the
 * network said is sent on (the details go to the server log) — the panel falls back to free-text input.
 */
import { ENV } from '@core/processUtils'
import SystemError, { StatusCodes } from '@core/systemError'

import * as Log from '@server/log/log'

import { assertBaseUrlAllowed } from './baseUrlGuard'
import { createGuardedFetch } from './guardedFetch'
import * as ProviderRegistry from './providerRegistry'

const logger = Log.getLogger('AiModelDiscovery')

// a model list is awaited by a dropdown: shorter than the timeout of a model call
const LIST_TIMEOUT_MS = 10000

// the largest model list read (the biggest catalogues are a few hundred KB)
const MAX_LIST_BYTES = 2 * 1024 * 1024

// the upstream answered, but not with a list
class UpstreamStatusError extends Error {
  constructor(status) {
    super(`HTTP ${status}`)
    this.status = status
  }
}

// the upstream sent more than a model list can be
class ResponseTooLargeError extends Error {
  constructor(limit) {
    super(`response over ${limit} bytes`)
  }
}

/**
 * Returns the time a list may take: the timeout of a model call, and at most the time a dropdown is worth waiting.
 * @returns {number} The timeout in milliseconds.
 */
const getListTimeoutMs = () => Math.min(ENV.aiRequestTimeoutMs, LIST_TIMEOUT_MS)

/**
 * Reads the body of a response as JSON, and stops reading (closing the connection) when it is over the cap.
 * @param {Response} response - The response.
 * @param {number} maxBytes - The largest body accepted.
 * @returns {Promise<unknown>} The parsed body.
 * @throws {ResponseTooLargeError} When the body, or its declared size, is over the cap.
 */
const readJsonCapped = async (response, maxBytes) => {
  if (Number(response.headers.get('content-length')) > maxBytes) {
    await response.body?.cancel().catch(() => undefined)
    throw new ResponseTooLargeError(maxBytes)
  }
  const chunks = []
  let received = 0
  // leaving the loop cancels the stream
  for await (const chunk of response.body ?? []) {
    received += chunk.byteLength
    if (received > maxBytes) throw new ResponseTooLargeError(maxBytes)
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

/**
 * Reads a JSON list from an URL. The timeout covers the connection, the headers and the body, and the body is capped.
 * @param {string} url - The URL.
 * @param {object} [options] - Options.
 * @param {object} [options.headers] - Request headers.
 * @param {Function} [options.fetchImpl] - The fetch to use.
 * @returns {Promise<unknown>} The parsed body.
 * @throws {UpstreamStatusError} When the upstream does not answer with a 2xx status.
 * @throws {ResponseTooLargeError} When the body is over the cap.
 */
const fetchJson = async (url, { headers, fetchImpl = fetch } = {}) => {
  const signal = AbortSignal.timeout(getListTimeoutMs())
  const response = await fetchImpl(url, { method: 'GET', headers, signal, redirect: 'error' })
  if (!response.ok) {
    // the error body is never read: it is not shown, and a provider could make it large
    await response.body?.cancel().catch(() => undefined)
    throw new UpstreamStatusError(response.status)
  }
  return readJsonCapped(response, MAX_LIST_BYTES)
}

const stripTrailingSlash = (s) => {
  if (!s) return s
  let end = s.length
  while (end > 0 && s[end - 1] === '/') end -= 1
  return s.slice(0, end)
}

const normaliseOpenAiBase = (baseUrl) => stripTrailingSlash(baseUrl || 'https://api.openai.com/v1')

// Heuristic filter that drops obvious non-chat models when an OpenAI-shaped
// API returns the kitchen sink. Best-effort only — anything unfamiliar is
// kept so users with niche backends are never blocked.
const isLikelyChatModel = (id) => {
  if (typeof id !== 'string') return false
  const lower = id.toLowerCase()
  const blacklist = [
    'whisper',
    'tts',
    'dall-e',
    'omni-moderation',
    'text-moderation',
    'text-embedding',
    'embedding',
    'davinci-002',
    'babbage-002',
  ]
  return !blacklist.some((needle) => lower.includes(needle))
}

const listOpenAiCompatible = async ({ baseUrl, apiKey, fetchImpl }) => {
  const base = normaliseOpenAiBase(baseUrl)
  const headers = { Accept: 'application/json' }
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`
  const json = await fetchJson(`${base}/models`, { headers, fetchImpl })
  const data = Array.isArray(json?.data) ? json.data : []
  return data.map((entry) => (entry && typeof entry.id === 'string' ? { id: entry.id } : null)).filter(Boolean)
}

const listOpenAi = async ({ apiKey }) => {
  if (!apiKey) throw new SystemError('aiApiKeyMissing', { provider: ProviderRegistry.providers.openai })
  const all = await listOpenAiCompatible({ baseUrl: 'https://api.openai.com/v1', apiKey })
  return all.filter((m) => isLikelyChatModel(m.id))
}

const listAnthropic = async ({ apiKey }) => {
  if (!apiKey) throw new SystemError('aiApiKeyMissing', { provider: ProviderRegistry.providers.anthropic })
  const json = await fetchJson('https://api.anthropic.com/v1/models', {
    headers: {
      Accept: 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
  })
  const data = Array.isArray(json?.data) ? json.data : []
  return data
    .map((entry) => {
      if (!entry || typeof entry.id !== 'string') return null
      const description = typeof entry.display_name === 'string' ? entry.display_name : undefined
      return { id: entry.id, description }
    })
    .filter(Boolean)
}

const listGoogle = async ({ apiKey }) => {
  if (!apiKey) throw new SystemError('aiApiKeyMissing', { provider: ProviderRegistry.providers.google })
  const json = await fetchJson(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
    { headers: { Accept: 'application/json' } }
  )
  const models = Array.isArray(json?.models) ? json.models : []
  return models
    .filter(
      (m) => Array.isArray(m?.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent')
    )
    .map((m) => {
      const raw = typeof m.name === 'string' ? m.name : ''
      const id = raw.startsWith('models/') ? raw.slice('models/'.length) : raw
      if (!id) return null
      const description = typeof m.displayName === 'string' ? m.displayName : undefined
      return { id, description }
    })
    .filter(Boolean)
}

/**
 * Converts a failure of a model list into the SystemError to send: a key and a status code, never the text of the
 * upstream or of the network.
 * @param {unknown} error - The failure.
 * @returns {SystemError} The error.
 */
const toListError = (error) => {
  if (error instanceof SystemError) return error
  if (error?.name === 'AbortError' || error?.name === 'TimeoutError') {
    return new SystemError('aiRequestTimeout', {}, StatusCodes.GATEWAY_TIMEOUT)
  }
  if (error instanceof UpstreamStatusError) {
    if (error.status === 401 || error.status === 403)
      return new SystemError('aiProviderAuth', {}, StatusCodes.BAD_GATEWAY)
    if (error.status === 429) return new SystemError('aiProviderRateLimited', {}, 429)
  }
  return new SystemError('aiModelListFailed', {}, StatusCodes.BAD_GATEWAY)
}

/**
 * Fetch and normalise the model list for the given provider.
 * @param {object} args - Args.
 * @param {string} args.provider - Provider key from `ProviderRegistry.providers`.
 * @param {string} [args.baseUrl] - Required for openai-compatible.
 * @param {string} [args.apiKey] - Required for cloud providers.
 * @param {object} [guardOptions] - Base URL guard options (`allowlist`, `lookup`), the same guard as model calls; the
 *   request to a base URL of the user is made with the guarded fetch, or with `fetchImpl` (tests).
 * @returns {Promise<Array<{id: string, description?: string}>>} The models.
 * @throws {SystemError} An error key with a status code (`aiModelListFailed` for an upstream failure without a more
 *   specific key).
 */
export const listForProvider = async ({ provider, baseUrl, apiKey }, guardOptions = {}) => {
  try {
    switch (provider) {
      case ProviderRegistry.providers.openai:
        return await listOpenAi({ apiKey })
      case ProviderRegistry.providers.anthropic:
        return await listAnthropic({ apiKey })
      case ProviderRegistry.providers.google:
        return await listGoogle({ apiKey })
      case ProviderRegistry.providers.openaiCompatible: {
        if (!baseUrl) throw new SystemError('aiBaseUrlMissing', { provider })
        await assertBaseUrlAllowed(baseUrl, guardOptions)
        return await listOpenAiCompatible({
          baseUrl,
          apiKey,
          fetchImpl: guardOptions.fetchImpl ?? createGuardedFetch(guardOptions),
        })
      }
      case ProviderRegistry.providers.vercelAiSdk:
        // Fixed-endpoint provider; no model selection applies.
        return []
      default:
        throw new SystemError('aiProviderInvalid', { provider })
    }
  } catch (error) {
    const listError = toListError(error)
    if (listError !== error) logger.warn(`Model list of ${provider} failed: ${error?.name}: ${error?.message}`)
    throw listError
  }
}
