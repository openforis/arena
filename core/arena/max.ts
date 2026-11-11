import { _curry2 } from './internal/_curry2'

/**
 * Returns the larger of two values.
 *
 * @param {*} a - The first value.
 * @param {*} b - The second value.
 *
 * @returns {*} - The result.
 */
export const max = _curry2((a: any, b: any): any => (b > a ? b : a))
