/**
 * Limits and defaults of the local AI server address and model.
 */
export const DEFAULT_LOCAL_SERVER_BASE_URL = 'http://localhost:1234/v1'

export const MAX_BASE_URL_LENGTH = 2048
export const MAX_MODEL_ID_LENGTH = 512

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
