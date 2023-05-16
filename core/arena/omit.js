import { _curry2 } from './internal/_curry2'

/**
 * Returns a partial copy of an object omitting the keys specified.
 *
 * @param {!Array} names - An array of String property names to omit from the new object.
 * @param {!object} object - The object to copy from.
 *
 * @returns {object} - A new object with properties from `names` not on it.
 */
export const omit = _curry2((names, object) => {
  const exclusionByName = names.reduce((acc, name) => {
    acc[name] = true
    return acc
  }, {})
  const result = {}
  for (var prop in object) {
    if (!exclusionByName[prop]) {
      result[prop] = object[prop]
    }
  }
  return result
})
