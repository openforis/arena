import { isNull } from './isNull'
import { isEmpty } from './isEmpty'

import { mapToObject } from './mapToObject'

/**
 * Stringify any object.
 * It handles objects, arrays, Map, Set, String, Number.
 *
 * @param {*} object - The value, object, to stringify.
 * @returns {*} - The stringified object.
 */
export const stringify = (object) => {
  if (isNull(object)) return null
  if (isEmpty(object)) return ''
  return JSON.stringify(object, (key, value) => {
    if (value.constructor === Map) return mapToObject(value)
    if (value.constructor === Set) return [...value]
    return isNull(key) ? JSON.stringify(value) : value
  })
}
