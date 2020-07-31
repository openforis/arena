import { isNull } from './isNull'

/**
 * Converts a JavaScript value to a JavaScript Object Notation (JSON) string.
 * It handles objects, arrays, Map, Set, String, Number.
 *
 * @param {*} object - The value, object, to stringify.
 * @returns {*} - The stringified object.
 */
export const stringify = (object) => {
  if (isNull(object)) return null
  return JSON.stringify(object, (key, value) => {
    if (value.constructor === Map)
      return {
        __type: 'Map',
        __values: JSON.stringify(Array.from(value.entries())),
      }
    if (value.constructor === Set)
      return {
        __type: 'Set',
        __values: JSON.stringify([...value]),
      }
    if (value.constructor === object) {
      return JSON.stringify(stringify(value))
    }
    return isNull(key) ? JSON.stringify(value) : value
  })
}
