/**
 * Frontend client for the per-user AI settings (access level and feature toggles). The providers have their own
 * client (`providers.ts`); the server never returns an API key.
 */
import axios from 'axios'

const BASE = '/api/ai/settings'

/**
 * Fetches the current user's AI settings: access level, toggles, account providers (no keys), default provider,
 * admin default and the instance fields.
 * @returns {Promise<object>} The settings.
 */
export const fetchSettings = async () => {
  const { data } = await axios.get(BASE)
  return data
}

/**
 * Saves the access level and the feature toggles (the providers are saved with their own calls).
 * @param {object} update - Settings to save.
 * @param {number} update.accessLevel - Access level (0-3).
 * @param {boolean} update.featuresEnabled - Access level above 0 (kept for older readers).
 * @param {object} update.featureToggles - One boolean per feature category.
 * @returns {Promise<object>} The updated settings.
 */
export const saveSettings = async (update) => {
  const { data } = await axios.put(BASE, update)
  return data
}
