import { _curry2 } from './internal/_curry2'

/**
 * Retrieves the value at the given path (undefined if any step is missing).
 *
 * @param {*} pathArray - The path (array of keys or indexes).
 * @param {*} object - The object.
 *
 * @returns {*} - The result.
 */
export const path = _curry2((pathArray: Array<string | number>, object: any): any => {
  let value = object
  for (const key of pathArray) {
    if (value === null || value === undefined) return undefined
    value = typeof key === 'number' && Number.isInteger(key) && key < 0 ? value[value.length + key] : value[key]
  }
  return value
})
