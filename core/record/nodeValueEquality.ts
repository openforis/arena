/**
 * Node value comparison used by the record edits: the browser refuses no-op edits, the records update thread
 * detects conflicts (the value changed since the proposal).
 */

type Normalized = string | null | { [key: string]: Normalized }

/**
 * Returns true for a plain object (not null, not an array).
 * @param {unknown} value - The value.
 * @returns {boolean} Whether the value is a plain object.
 */
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Normalizes a node value: empty values become null, primitives strings, objects sorted non-empty entries.
 * @param {unknown} value - The node value.
 * @returns {Normalized} The normalized value.
 */
const normalize = (value: unknown): Normalized => {
  if (value === null || value === undefined || value === '') return null
  if (!isPlainObject(value)) return String(value)

  const entries = Object.keys(value)
    .sort((keyA, keyB) => keyA.localeCompare(keyB))
    .map((key) => [key, normalize(value[key])] as const)
    .filter(([, normalizedValue]) => normalizedValue !== null)
  return entries.length === 0 ? null : Object.fromEntries(entries)
}

/**
 * Compares two node values, ignoring empty props, key order and number/string differences.
 * @param {unknown} valueA - The first value.
 * @param {unknown} valueB - The second value.
 * @returns {boolean} Whether the values are equal.
 */
export const areNodeValuesEqual = (valueA: unknown, valueB: unknown): boolean =>
  JSON.stringify(normalize(valueA)) === JSON.stringify(normalize(valueB))
