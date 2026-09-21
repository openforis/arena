import { _curry3 } from './internal/_curry3'
import { equals } from './equals'
import { path } from './path'

/**
 * Checks if the value at the given path is deeply equal to the given value.
 *
 * @param {*} pathArray - The path (array of keys or indexes).
 * @param {*} value - The value to compare.
 * @param {*} object - The object.
 *
 * @returns {boolean} - The result.
 */
export const pathEq = _curry3((pathArray: Array<string | number>, value: any, object: any): boolean =>
  equals(path(pathArray, object), value)
)
