/**
 * Expiry of the suggestions that describe a moment (7: validation messages, 8: data imported).
 */
export const SUGGESTION_EXPIRY_DAYS = 7

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Returns the expiry of a suggestion created at a date.
 * @param {Date} createdAt - Creation date.
 * @returns {string} The ISO date SUGGESTION_EXPIRY_DAYS later.
 */
export const getSuggestionExpiresAt = (createdAt: Date): string =>
  new Date(createdAt.getTime() + SUGGESTION_EXPIRY_DAYS * DAY_MS).toISOString()
