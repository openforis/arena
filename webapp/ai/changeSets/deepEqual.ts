const normalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(normalize)
  if (value && typeof value === 'object') {
    const source = value as Record<string, unknown>
    return Object.fromEntries(
      Object.keys(source)
        .sort()
        .map((key) => [key, normalize(source[key])])
    )
  }
  return value ?? null
}

/**
 * Deep equality of JSON-like values (key order ignored, undefined treated as null).
 * @param {unknown} a - First value.
 * @param {unknown} b - Second value.
 * @returns {boolean} True when equal.
 */
export const isDeepEqual = (a: unknown, b: unknown): boolean =>
  JSON.stringify(normalize(a)) === JSON.stringify(normalize(b))
