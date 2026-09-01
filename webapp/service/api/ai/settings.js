/**
 * Frontend client for the per-user AI settings endpoints. The API key is
 * never returned by the server, so this module always works with a
 * `hasApiKey` boolean rather than the key itself.
 */
import axios from 'axios'

const BASE = '/api/ai/settings'

/**
 * Fetches the current user's AI settings and the effective provider/source
 * (user / admin-default / null).
 * @returns {Promise<object>} The settings descriptor.
 */
export const fetchSettings = async () => {
  const { data } = await axios.get(BASE)
  return data
}

/**
 * Saves the user's AI settings. Pass `apiKey: undefined` to keep the
 * existing key untouched; pass `apiKey: ''` to clear it.
 * @param {object} update - Settings to save.
 * @param {string} update.provider - openai|anthropic|google|openai-compatible.
 * @param {string} update.model - Model identifier.
 * @param {string} [update.baseUrl] - For openai-compatible only.
 * @param {string} [update.apiKey] - New API key (omit to keep existing, '' to clear).
 * @param {boolean} update.enabled - Whether the personal override is active.
 * @returns {Promise<object>} The updated settings descriptor.
 */
export const saveSettings = async (update) => {
  const { data } = await axios.put(BASE, update)
  return data
}

/**
 * Issues a tiny test call to the provider to verify connectivity. When draft
 * params are supplied they are used instead of the persisted config, allowing
 * the UI to test unsaved changes. `apiKey` is optional — the server falls back
 * to the user's saved encrypted key when omitted.
 * @param {object} [draft] - Draft form values to test.
 * @param {string} [draft.provider] - Provider key.
 * @param {string} [draft.model] - Model identifier.
 * @param {string} [draft.baseUrl] - Base URL (openai-compatible only).
 * @param {string} [draft.apiKey] - API key from the form, if changed.
 * @returns {Promise<{ok: boolean, latencyMs: number, errorMessage?: string}>} The test result.
 */
export const testConnection = async (draft = {}) => {
  const { data } = await axios.post(`${BASE}/test`, draft)
  return data
}

/**
 * Fetches the list of models offered by the given provider. If `apiKey` is
 * omitted the server falls back to the user's saved encrypted key.
 * @param {object} args - Args.
 * @param {string} args.provider - Provider key.
 * @param {string} [args.baseUrl] - For openai-compatible / Vercel AI SDK.
 * @param {string} [args.apiKey] - API key from the in-progress form.
 * @returns {Promise<{models: Array<{id: string, description?: string}>}>} Models list.
 */
export const fetchModels = async ({ provider, baseUrl, apiKey }) => {
  const { data } = await axios.post(`${BASE}/models`, { provider, baseUrl, apiKey })
  return data
}

/**
 * Removes the personal override. Subsequent AI calls fall through to the
 * admin default.
 * @returns {Promise<object>} The updated settings descriptor (now empty).
 */
export const clearSettings = async () => {
  const { data } = await axios.delete(BASE)
  return data
}
