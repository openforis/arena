const maxLimit = 1000

/**
 * Parses the `limit` of the category items request.
 * @param {unknown} value - The numeric value of the param (null when missing or not a number).
 * @returns {number|null} The limit clamped to 1000, or null (no limit) when missing or not a positive integer.
 */
export const parseItemsLimit = (value: unknown): number | null =>
  Number.isInteger(value) && (value as number) > 0 ? Math.min(value as number, maxLimit) : null
