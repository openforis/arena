/**
 * Local AI server settings helpers: the old per-user key, its normalization (read by the conversion to the provider
 * list) and the browser storage accessor.
 */
import type { AiLocalServerSettings, RemovableStorage } from './types'

export const DEFAULT_LOCAL_SERVER_BASE_URL = 'http://localhost:1234/v1'

export const MAX_BASE_URL_LENGTH = 2048
export const MAX_MODEL_ID_LENGTH = 512

/**
 * Returns the localStorage key of the user's settings.
 * @param {string} userUuid - User UUID.
 * @returns {string} The key.
 */
export const getLocalServerSettingsKey = (userUuid: string): string => `arena.ai.localServer.${userUuid}`

/**
 * Returns the trimmed string when it is non-empty and not longer than the limit.
 * @param {unknown} value - Raw value.
 * @param {number} maxLength - Maximum length.
 * @returns {string|null} The trimmed string, or null.
 */
export const trimmedString = (value: unknown, maxLength: number): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed.length <= maxLength ? trimmed : null
}

/**
 * Removes the trailing slashes of a URL.
 * @param {string} url - URL.
 * @returns {string} The URL without trailing slashes.
 */
export const stripTrailingSlashes = (url: string): string => url.replace(/\/+$/, '')

/**
 * Trims the URL and its trailing slashes; invalid values give the default URL.
 * @param {unknown} value - Raw value.
 * @returns {string} The base URL.
 */
const normalizeBaseUrl = (value: unknown): string => {
  const trimmed = trimmedString(value, MAX_BASE_URL_LENGTH)
  const withoutSlashes = trimmed ? stripTrailingSlashes(trimmed) : null
  return withoutSlashes || DEFAULT_LOCAL_SERVER_BASE_URL
}

/**
 * Keeps the valid values of stored or typed settings; the others get their default.
 * @param {unknown} input - Raw settings.
 * @returns {AiLocalServerSettings} The settings.
 */
export const normalizeLocalServerSettings = (input: unknown): AiLocalServerSettings => {
  const raw = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  return {
    enabled: raw.enabled === true,
    baseUrl: normalizeBaseUrl(raw.baseUrl),
    modelId: trimmedString(raw.modelId, MAX_MODEL_ID_LENGTH),
    preferLocal: raw.preferLocal !== false,
  }
}

/**
 * Returns the browser's localStorage, or null when it is not accessible.
 * @returns {RemovableStorage|null} The storage.
 */
export const getBrowserStorage = (): RemovableStorage | null => {
  try {
    return globalThis.localStorage ?? null
  } catch {
    // accessing the property throws when storage is blocked
    return null
  }
}
