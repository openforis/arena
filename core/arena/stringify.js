import { isNull } from './isNull'

/**
 * Converts a JavaScript value to a JavaScript Object Notation (JSON) string.
 * It handles objects, arrays, Map, Set, String, Number.
 *
 * @param {*} object - The value, object, to stringify.
 * @param _replacer
 * @param space
 * @returns {*} - The stringified object.
 */
export const stringify = (object, _replacer, space = null ) => {
  if (isNull(object)) return null

  const replacer = (key, value) => {
    if (isNull(value)) return null

    if (isNull(key)) {
      return stringify(value)
    }
    if (value.constructor === Map)
      return {
        __type: 'Map',
        __values: stringify(Array.from(value.entries())),
      }
    if (value.constructor === Set)
      return {
        __type: 'Set',
        __values: stringify([...value]),
      }
    return value
  }
  return JSON.stringify(object, replacer, space)
}
