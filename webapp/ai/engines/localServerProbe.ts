/**
 * Probe of the local AI server (GET /models, 3 s timeout) and its limits (LM Studio context length).
 * No AI SDK import: UI code loads this module.
 */
import {
  createLocalServerFetch,
  type FetchFunction,
  type LocalServerFetchImpl,
  toEngineErrorInfo,
} from './localServerErrors'
import type { AiContextWindow, AiEngineErrorInfo, AiEngineLimits } from './types'

export const DEFAULT_LOCAL_CONTEXT_TOKENS = 8192
export const PROBE_TIMEOUT_MS = 3000
// the first call loads the model into memory
export const TEST_CHAT_TIMEOUT_MS = 60000

// also the ratio of the assistant's context estimate when a provider reports no usage
export const CHARS_PER_TOKEN = 3
const PROMPT_SHARE = 0.75 // a quarter of the context is kept for the answer (not capped: the server decides)

export type LocalServerProbeResult = {
  reachable: boolean
  models: string[]
  contextTokens: number | null
  error: AiEngineErrorInfo | null
}

/**
 * Returns the local engine limits for a context size.
 * @param {number|null} contextTokens - Context size, or null when unknown (8,192 is used).
 */
export const getLocalServerLimits = (contextTokens: number | null): AiEngineLimits => {
  const maxPromptTokens = Math.floor((contextTokens ?? DEFAULT_LOCAL_CONTEXT_TOKENS) * PROMPT_SHARE)
  return { maxPromptChars: maxPromptTokens * CHARS_PER_TOKEN, maxPromptTokens }
}

/**
 * Returns the context window of the local server's model.
 * @param {number|null} contextTokens - Context size reported by the server, or null when unknown.
 * @returns {AiContextWindow} The size, or 8,192 tokens marked as assumed.
 */
export const getLocalServerContextWindow = (contextTokens: number | null): AiContextWindow =>
  contextTokens && contextTokens > 0
    ? { tokens: contextTokens, assumed: false }
    : { tokens: DEFAULT_LOCAL_CONTEXT_TOKENS, assumed: true }

/**
 * Returns the object entries of the `data` array of a response body.
 * @param {unknown} json - Response body.
 */
const dataEntries = (json: unknown): Record<string, unknown>[] => {
  const data = (json as { data?: unknown } | null)?.data
  return Array.isArray(data) ? data.filter((entry) => entry && typeof entry === 'object') : []
}

/**
 * Returns the model ids of an OpenAI-compatible GET /models response.
 * @param {unknown} json - Response body.
 * @returns {string[]} The ids (unique, non-blank).
 */
export const parseLocalServerModelIds = (json: unknown): string[] => {
  const ids = dataEntries(json)
    .map((entry) => entry.id)
    .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
  return [...new Set(ids)]
}

/**
 * Returns the value when it is a positive integer.
 */
const positiveInteger = (value: unknown): number | null =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null

/**
 * Returns the context size of a model from LM Studio's GET /api/v0/models.
 * @param {unknown} json - Response body.
 * @returns {number|null} loaded_context_length, else max_context_length, else null.
 */
export const parseLmStudioContextTokens = (json: unknown, modelId: string): number | null => {
  const entry = dataEntries(json).find((candidate) => candidate.id === modelId)
  if (!entry) return null
  return positiveInteger(entry.loaded_context_length) ?? positiveInteger(entry.max_context_length)
}

/**
 * Returns the ids of the embedding models of an LM Studio models response.
 * @param {unknown} lmStudioJson - Response body.
 */
const embeddingModelIds = (lmStudioJson: unknown): Set<string> =>
  new Set(
    dataEntries(lmStudioJson)
      .filter((entry) => entry.type === 'embeddings' && typeof entry.id === 'string')
      .map((entry) => entry.id as string)
  )

/**
 * Reads a JSON body, never throwing.
 * @returns {Promise<unknown>} The body, or null when invalid.
 */
const readJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json()
  } catch {
    return null
  }
}

/**
 * Fetches LM Studio's model details (best effort: other servers do not have this endpoint).
 * @param {FetchFunction} localFetch - The local server fetch.
 * @param {string} baseUrl - Server base URL.
 * @returns {Promise<unknown>} The body, or null.
 */
const fetchLmStudioModels = async (localFetch: FetchFunction, baseUrl: string, signal: AbortSignal) => {
  try {
    return await readJson(await localFetch(new URL('/api/v0/models', `${baseUrl}/`).href, { method: 'GET', signal }))
  } catch {
    return null
  }
}

/**
 * Checks the local server: GET {baseUrl}/models, then LM Studio's model details for the context size.
 * @param {object} params - Parameters.
 * @param {string} params.baseUrl - Server base URL.
 * @param {string|null} params.modelId - Chosen model (the first listed model when null).
 * @param {LocalServerFetchImpl} params.fetchImpl - Underlying fetch.
 * @param {number} [params.timeoutMs] - Timeout of the whole probe (default 3 s).
 * @returns {Promise<LocalServerProbeResult>} The result (never rejects).
 */
export const probeLocalServer = async ({
  baseUrl,
  modelId,
  fetchImpl,
  timeoutMs = PROBE_TIMEOUT_MS,
}: {
  baseUrl: string
  modelId: string | null
  fetchImpl: LocalServerFetchImpl
  timeoutMs?: number
}): Promise<LocalServerProbeResult> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const localFetch = createLocalServerFetch({ fetchImpl, baseUrl, modelId })
  try {
    const response = await localFetch(`${baseUrl}/models`, { method: 'GET', signal: controller.signal })
    const listed = parseLocalServerModelIds(await readJson(response))
    const lmStudioJson = await fetchLmStudioModels(localFetch, baseUrl, controller.signal)
    const embeddings = embeddingModelIds(lmStudioJson)
    const models = listed.filter((id) => !embeddings.has(id))
    const contextModelId = modelId ?? models[0] ?? null
    const contextTokens = contextModelId ? parseLmStudioContextTokens(lmStudioJson, contextModelId) : null
    return { reachable: true, models, contextTokens, error: null }
  } catch (error) {
    return { reachable: false, models: [], contextTokens: null, error: toEngineErrorInfo(error, baseUrl) }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Settings Test: the probe, then one real minimal chat completion with the chosen (else the first) model. A server
 * that lists its models but cannot answer (no model loaded, wrong model, error) is reported as failed.
 * @param {object} params - Parameters of probeLocalServer.
 * @returns {Promise<LocalServerProbeResult>} The probe result; when the chat call failed: not reachable, with its error.
 */
export const testLocalServerChat = async (params: {
  baseUrl: string
  modelId: string | null
  fetchImpl: LocalServerFetchImpl
}): Promise<LocalServerProbeResult> => {
  const probe = await probeLocalServer(params)
  const modelId = params.modelId ?? probe.models[0] ?? null
  if (!probe.reachable || !modelId) return probe
  const { baseUrl, fetchImpl } = params
  try {
    const localFetch = createLocalServerFetch({ fetchImpl, baseUrl, modelId })
    await localFetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // the only call with a token cap: a one-word answer; reasoning_effort none is ignored by servers not knowing it
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: 'Reply with one word: ok' }],
        max_tokens: 8,
        reasoning_effort: 'none',
      }),
      signal: AbortSignal.timeout(TEST_CHAT_TIMEOUT_MS),
    })
    return probe
  } catch (error) {
    return { ...probe, reachable: false, error: toEngineErrorInfo(error, baseUrl) }
  }
}
