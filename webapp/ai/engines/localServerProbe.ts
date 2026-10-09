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
import type { AiEngineErrorInfo, AiEngineLimits } from './types'

export const DEFAULT_LOCAL_CONTEXT_TOKENS = 8192
export const LOCAL_SERVER_MAX_STEPS = 6 // adjusted from the manual matrix
export const PROBE_TIMEOUT_MS = 3000

const CHARS_PER_TOKEN = 3
const PROMPT_SHARE = 0.75 // a quarter of the context is kept for the answer

export type LocalServerProbeResult = {
  reachable: boolean
  models: string[]
  contextTokens: number | null
  error: AiEngineErrorInfo | null
}

/**
 * Returns the local engine limits for a context size.
 * @param {number|null} contextTokens - Context size, or null when unknown (8,192 is used).
 * @returns {AiEngineLimits} The limits.
 */
export const getLocalServerLimits = (contextTokens: number | null): AiEngineLimits => ({
  maxPromptChars: Math.floor((contextTokens ?? DEFAULT_LOCAL_CONTEXT_TOKENS) * CHARS_PER_TOKEN * PROMPT_SHARE),
  maxSteps: LOCAL_SERVER_MAX_STEPS,
})

/**
 * Returns the object entries of the `data` array of a response body.
 * @param {unknown} json - Response body.
 * @returns {Record<string, unknown>[]} The entries.
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
 * @param {unknown} value - The value.
 * @returns {number|null} The value, or null.
 */
const positiveInteger = (value: unknown): number | null =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null

/**
 * Returns the context size of a model from LM Studio's GET /api/v0/models.
 * @param {unknown} json - Response body.
 * @param {string} modelId - Model id.
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
 * @returns {Set<string>} The ids.
 */
const embeddingModelIds = (lmStudioJson: unknown): Set<string> =>
  new Set(
    dataEntries(lmStudioJson)
      .filter((entry) => entry.type === 'embeddings' && typeof entry.id === 'string')
      .map((entry) => entry.id as string)
  )

/**
 * Reads a JSON body, never throwing.
 * @param {Response} response - The response.
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
 * @param {string} baseUrl - Server base URL.
 * @param {AbortSignal} signal - Abort signal.
 * @returns {Promise<unknown>} The body, or null.
 */
// best effort: other OpenAI-compatible servers do not have this endpoint
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
