import { _curry2 } from './internal/_curry2'

/**
 * Calls the function with every value of the object and returns the (same) object.
 *
 * @param {*} fn - The function called with the value, the key and the object.
 * @param {*} object - The object.
 *
 * @returns {object} - The result.
 */
export const forEachObjIndexed = _curry2((fn: (value: any, key: string, object: any) => void, object: any): any => {
  Object.keys(object).forEach((key) => fn(object[key], key, object))
  return object
})
