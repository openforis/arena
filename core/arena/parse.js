import { isNull } from './isNull'
import { isEmpty } from './isEmpty'

/**
 * Converts a JavaScript Object Notation (JSON) string to a Javascript value.
 * It handles objects, arrays, Map, Set, String, Number.
 * It is the inverse of Stringify.
 *
 * @param {string!} string - The string.
 * @returns {*} - The value, a Javascript value.
 */
export const parse = (string) => {
  if (isNull(string)) return null
  if (isEmpty(string)) return ''
  return JSON.parse(string, (key, value) => {
    if (value.__type === 'Map') return new Map(JSON.parse(value.__values))
    if (value.__type === 'Set') return new Set(JSON.parse(value.__values))
    return value
  })
}
