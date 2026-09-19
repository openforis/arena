import { _curry2 } from './internal/_curry2'
import { _equals } from './internal/_equals'

/**
 * Checks if two values are deeply equal.
 *
 * @param {*} a - The first value.
 * @param {*} b - The second value.
 *
 * @returns {boolean} - The result.
 */
export const equals = _curry2((a: any, b: any): boolean => _equals(a, b))
