/**
 * Provider-side `/models` discovery used by the AI Settings panel to turn
 * the free-text Model field into a populated dropdown.
 *
 * Each provider has its own list endpoint, auth scheme, and response
 * shape. This module normalises them all into `{ id, description? }`
 * descriptors and trims the per-provider clutter (audio, embedding,
 * moderation, image models) where we can identify it cheaply.
 *
 * On any failure (network, auth, parse) we surface `aiModelListFailed`
 * with the upstream message — the panel falls back to free-text input.
 */
import SystemError from '@core/systemError'

import * as ProviderRegistry from './providerRegistry'

const DEFAULT_TIMEOUT_MS = 10000

const fetchWithTimeout = async (url, { headers, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { method: 'GET', headers, signal: controller.signal })
    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(`HTTP ${response.status}${body ? ` — ${body.slice(0, 200)}` : ''}`)
    }
    return response.json()
  } finally {
    clearTimeout(timer)
  }
}

const stripTrailingSlash = (s) => (s ? s.replace(/\/+$/, '') : s)

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

const listOpenAiCompatible = async ({ baseUrl, apiKey }) => {
  const base = normaliseOpenAiBase(baseUrl)
  const headers = { Accept: 'application/json' }
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`
  const json = await fetchWithTimeout(`${base}/models`, { headers })
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
  const json = await fetchWithTimeout('https://api.anthropic.com/v1/models', {
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
  const json = await fetchWithTimeout(
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
 * Fetch and normalise the model list for the given provider.
 * @param {object} args - Args.
 * @param {string} args.provider - Provider key from `ProviderRegistry.providers`.
 * @param {string} [args.baseUrl] - Required for openai-compatible.
 * @param {string} [args.apiKey] - Required for cloud providers.
 * @returns {Promise<Array<{id: string, description?: string}>>} The models.
 * @throws {SystemError} `aiModelListFailed` on any upstream failure.
 */
export const listForProvider = async ({ provider, baseUrl, apiKey }) => {
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
        return await listOpenAiCompatible({ baseUrl, apiKey })
      }
      case ProviderRegistry.providers.vercelAiSdk:
        // Fixed-endpoint provider; no model selection applies.
        return []
      default:
        throw new SystemError('aiProviderInvalid', { provider })
    }
  } catch (error) {
    if (error instanceof SystemError) throw error
    throw new SystemError('aiModelListFailed', { message: error?.message || String(error) })
  }
}
