/**
 * Frontend client for the AI provider endpoints (account providers and the default provider). The API key is never
 * returned by the server; a saved provider's key is only used by the server on the endpoint it was saved with.
 */
import axios from 'axios'

export type AiProviderRequest = {
  id?: string
  type?: string
  name?: string
  model?: string | null
  baseUrl?: string | null
  apiKey?: string
}

export type AiProviderTestResponse = {
  ok: boolean
  latencyMs: number
  errorMessage?: string
  errorKey?: string
  errorParams?: Record<string, unknown>
}

export type AiProviderModelsResponse = { models: Array<{ id: string; description?: string }> }

type SettingsBody = Record<string, any>

/**
 * Returns the URL of one provider (ids contain ':', which is encoded).
 * @param {string} id - Provider id.
 * @returns {string} The URL.
 */
const providerUrl = (id: string): string => `/api/ai/providers/${encodeURIComponent(id)}`

/**
 * Tests a draft (`type`, `model`, `baseUrl`, `apiKey`) or a saved provider (`id` plus the changed fields).
 * @param {AiProviderRequest} input - Draft or saved provider.
 * @returns {Promise<AiProviderTestResponse>} The result (a failed test is `ok: false`, not an error).
 */
export const testProvider = async (input: AiProviderRequest): Promise<AiProviderTestResponse> => {
  const { data } = await axios.post('/api/ai/providers/test', input)
  return data
}

/**
 * Lists the models of a draft or a saved provider.
 * @param {AiProviderRequest} input - Draft or saved provider.
 * @returns {Promise<AiProviderModelsResponse>} The models.
 */
export const fetchProviderModels = async (input: AiProviderRequest): Promise<AiProviderModelsResponse> => {
  const { data } = await axios.post('/api/ai/providers/models', input)
  return data
}

/**
 * Adds an account provider (the server tests it again before saving).
 * @param {AiProviderRequest} input - `type`, `name`, `model`, `baseUrl`, `apiKey`.
 * @returns {Promise<{provider: object, settings: object}>} The new entry and the settings.
 */
export const addProvider = async (
  input: AiProviderRequest
): Promise<{ provider: SettingsBody; settings: SettingsBody }> => {
  const { data } = await axios.post('/api/ai/providers', input)
  return data
}

/**
 * Edits an account provider (`apiKey` omitted keeps the saved key, on the same endpoint only).
 * @param {string} id - Provider id.
 * @param {AiProviderRequest} input - Changed fields.
 * @returns {Promise<{provider: object, settings: object}>} The entry and the settings.
 */
export const updateProvider = async (
  id: string,
  input: AiProviderRequest
): Promise<{ provider: SettingsBody; settings: SettingsBody }> => {
  const { data } = await axios.put(providerUrl(id), input)
  return data
}

/**
 * Removes an account provider (a removed default becomes Arena default on the server).
 * @param {string} id - Provider id.
 * @returns {Promise<{settings: object}>} The settings.
 */
export const removeProvider = async (id: string): Promise<{ settings: SettingsBody }> => {
  const { data } = await axios.delete(providerUrl(id))
  return data
}

/**
 * Sets the default provider. `origin: 'converted'` is only for the conversion of the old local settings.
 * @param {object} params - Parameters.
 * @param {string} params.providerId - Provider id.
 * @param {string} [params.origin] - 'converted' for the conversion call.
 * @returns {Promise<{applied: boolean, settings: object}>} Whether the default changed, and the settings.
 */
export const setDefaultProvider = async ({
  providerId,
  origin,
}: {
  providerId: string
  origin?: 'converted'
}): Promise<{ applied: boolean; settings: SettingsBody }> => {
  const { data } = await axios.put('/api/ai/settings/default', origin ? { providerId, origin } : { providerId })
  return data
}
