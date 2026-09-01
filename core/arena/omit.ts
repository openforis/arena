import { _curry2 } from './internal/_curry2'

type AnyRecord = Record<string, unknown>

/**
 * Returns a partial copy of an object omitting the keys specified.
 *
 * @param {!Array} names - An array of String property names to omit from the new object.
 * @param {!object} object - The object to copy from.
 *
 * @returns {object} - A new object with properties from `names` not on it.
 */
export const omit = _curry2((names: string | string[], object: AnyRecord): AnyRecord => {
  const namesArray = Array.isArray(names) ? names : [names]
  const exclusionByName = namesArray.reduce<Record<string, boolean>>((acc, name) => {
    acc[name] = true
    return acc
  }, {})
  const result: AnyRecord = {}
  for (const prop in object) {
    if (!exclusionByName[prop]) {
      result[prop] = object[prop]
    }
  }
  return result
})
