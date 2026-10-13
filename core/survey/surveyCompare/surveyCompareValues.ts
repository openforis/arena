// Value normalization used to compare survey elements coming from different environments.

const ignoredKeys = new Set(['uuid', 'id'])
const expressionKeys = new Set(['expression', 'applyIf'])

const isEmptyValue = (value: unknown): boolean => {
  if (value === null || value === undefined || value === false || value === '') return true
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

const normalizeString = ({ value, key }: { value: string; key?: string }): string => {
  const trimmed = value.trim()
  return key && expressionKeys.has(key) ? trimmed.replaceAll(/\s+/g, ' ') : trimmed
}

/**
 * Normalizes a value for comparison: drops ids and empty values, trims strings, sorts object keys.
 * @param {any} value - The value to normalize.
 * @param {string} [key] - The key of the value in its parent object.
 * @returns {any} - The normalized value (undefined when empty).
 */
export const normalizeValue = (value: any, key?: string): any => {
  if (typeof value === 'string') {
    const normalized = normalizeString({ value, key })
    return normalized === '' ? undefined : normalized
  }
  if (Array.isArray(value)) {
    const items = value.map((item) => normalizeValue(item)).filter((item) => item !== undefined)
    return items.length === 0 ? undefined : items
  }
  if (value && typeof value === 'object') {
    const result = {}
    for (const childKey of Object.keys(value).sort((a, b) => a.localeCompare(b))) {
      if (ignoredKeys.has(childKey)) continue
      const childValue = normalizeValue(value[childKey], childKey)
      if (childValue !== undefined) {
        result[childKey] = childValue
      }
    }
    return isEmptyValue(result) ? undefined : result
  }
  return isEmptyValue(value) ? undefined : value
}

/**
 * Compares two already normalized values.
 * @param {any} valueA - First value.
 * @param {any} valueB - Second value.
 * @returns {boolean} - True if the values are equal.
 */
export const areNormalizedValuesEqual = (valueA: any, valueB: any): boolean =>
  JSON.stringify(valueA) === JSON.stringify(valueB)

/**
 * Compares the normalized values of the specified keys of two objects.
 * @param {object} params - The parameters.
 * @param {object} params.source - Source object (already normalized).
 * @param {object} params.target - Target object (already normalized).
 * @returns {string[]} - The keys whose values differ, sorted.
 */
export const getDifferentKeys = ({ source = {}, target = {} }: { source?: object; target?: object }): string[] => {
  const keys = new Set([...Object.keys(source ?? {}), ...Object.keys(target ?? {})])
  return [...keys]
    .filter((key) => !areNormalizedValuesEqual(source?.[key], target?.[key]))
    .sort((a, b) => a.localeCompare(b))
}
