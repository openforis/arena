import { _curry2 } from './internal/_curry2'

/**
 * Returns a function that when supplied an object returns the indicated property of that object.
 * If the object is `null` or `undefined`, `undefined` is returned.
 *
 * @param {!string|number} property - The property name or array index (negative indexes count from the end).
 * @param {!object} object - The object to query.
 *
 * @returns {any} - The value at `object.property`.
 */
export const prop = _curry2((property: PropertyKey, object: any): unknown => {
  if (object === null || object === undefined) return undefined
  if (typeof property === 'number' && Number.isInteger(property) && property < 0 && object.length !== undefined) {
    return object[object.length + property]
  }
  return object[property]
})
