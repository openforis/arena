import { _curry2 } from './internal/_curry2'

/**
 * Returns the concatenation of two arrays or two strings.
 *
 * @param {*} a - The first array or string.
 * @param {*} b - The second array or string.
 *
 * @returns {*} - The result.
 */
export const concat = _curry2((a: any, b: any): any => a.concat(b))
