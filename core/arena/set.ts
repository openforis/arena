import { _curry3 } from './internal/_curry3'

type MutableRecord = Record<PropertyKey, unknown>

/**
 * Sets the value of the `prop` property of the specified object.
 * It does not return a clone of the object but it does side effect on it.
 *
 * @param {!string} prop - The name of the property to set.
 * @param {!any} value - The value to set.
 * @param {!object} obj - The object to modify.
 * @returns {object} - The object itself.
 */
export const set = _curry3((prop: PropertyKey, value: unknown, obj: MutableRecord): MutableRecord => {
  obj[prop] = value
  return obj
})
