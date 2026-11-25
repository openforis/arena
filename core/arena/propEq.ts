import { equals } from './equals'
import { _curry3 } from './internal/_curry3'

/**
 * Checks if the property of the object is deeply equal to the given value.
 *
 * @param {*} value - The value to compare.
 */
export const propEq = _curry3((property: PropertyKey, value: any, object: any): boolean =>
  equals(object === null || object === undefined ? undefined : (object as any)[property], value)
)
