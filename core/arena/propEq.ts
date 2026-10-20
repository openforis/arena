import { _curry3 } from './internal/_curry3'
import { equals } from './equals'

/**
 * Checks if the property of the object is deeply equal to the given value.
 *
 * @param {*} property - The property name.
 * @param {*} value - The value to compare.
 * @param {*} object - The object.
 *
 * @returns {boolean} - The result.
 */
export const propEq = _curry3((property: PropertyKey, value: any, object: any): boolean =>
  equals(object === null || object === undefined ? undefined : (object as any)[property], value)
)
