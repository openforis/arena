/**
 * Local AI server settings, per user and per device, in localStorage (never sent to the Arena server).
 */
import type { AiLocalServerSettings, StorageLike } from './types'

export const DEFAULT_LOCAL_SERVER_BASE_URL = 'http://localhost:1234/v1'

const MAX_BASE_URL_LENGTH = 2048
const MAX_MODEL_ID_LENGTH = 512

/**
 * Returns the default settings (local server off).
 * @returns {AiLocalServerSettings} The defaults.
 */
export const defaultLocalServerSettings = (): AiLocalServerSettings => ({
  enabled: false,
  baseUrl: DEFAULT_LOCAL_SERVER_BASE_URL,
  modelId: null,
  preferLocal: true,
})

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
const trimmedString = (value: unknown, maxLength: number): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed.length <= maxLength ? trimmed : null
}

/**
 * Trims the URL and its trailing slashes; invalid values give the default URL.
 * @param {unknown} value - Raw value.
 * @returns {string} The base URL.
 */
const normalizeBaseUrl = (value: unknown): string => {
  const trimmed = trimmedString(value, MAX_BASE_URL_LENGTH)
  const withoutSlashes = trimmed?.replace(/\/+$/, '')
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
 * Reads the user's settings; unavailable storage or corrupt JSON give the defaults.
 * @param {object} params - Parameters.
 * @param {StorageLike|null} params.storage - Storage.
 * @param {string|null} params.userUuid - User UUID.
 * @returns {AiLocalServerSettings} The settings.
 */
export const loadLocalServerSettings = ({
  storage,
  userUuid,
}: {
  storage: StorageLike | null
  userUuid: string | null
}): AiLocalServerSettings => {
  if (!storage || !userUuid) return defaultLocalServerSettings()
  try {
    const raw = storage.getItem(getLocalServerSettingsKey(userUuid))
    return raw ? normalizeLocalServerSettings(JSON.parse(raw)) : defaultLocalServerSettings()
  } catch {
    return defaultLocalServerSettings()
  }
}

/**
 * Stores the user's settings.
 * @param {object} params - Parameters.
 * @param {StorageLike|null} params.storage - Storage.
 * @param {string|null} params.userUuid - User UUID.
 * @param {AiLocalServerSettings} params.settings - Settings (normalized before saving).
 * @returns {boolean} False when the storage is unavailable or full.
 */
export const saveLocalServerSettings = ({
  storage,
  userUuid,
  settings,
}: {
  storage: StorageLike | null
  userUuid: string | null
  settings: AiLocalServerSettings
}): boolean => {
  if (!storage || !userUuid) return false
  try {
    storage.setItem(getLocalServerSettingsKey(userUuid), JSON.stringify(normalizeLocalServerSettings(settings)))
    return true
  } catch {
    return false
  }
}

/**
 * Returns the browser's localStorage or sessionStorage, or null when it is not accessible.
 * @param {'local'|'session'} [kind] - Which storage (default local).
 * @returns {StorageLike|null} The storage.
 */
export const getBrowserStorage = (kind: 'local' | 'session' = 'local'): StorageLike | null => {
  try {
    const storage = kind === 'local' ? globalThis.localStorage : globalThis.sessionStorage
    return storage ?? null
  } catch {
    // accessing the property throws when storage is blocked
    return null
  }
}
