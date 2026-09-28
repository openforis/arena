import { _curry2 } from './internal/_curry2'

/**
 * Returns the first `n` elements of the list or string.
 *
 * @param {*} n - The number of elements to take.
 * @param {*} list - The array or string.
 *
 * @returns {*} - The result.
 */
export const take = _curry2((n: number, list: any): any => list.slice(0, n < 0 ? Infinity : n))
