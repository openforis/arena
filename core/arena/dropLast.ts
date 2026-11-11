import { _curry2 } from './internal/_curry2'

/**
 * Returns the list or string without its last `n` elements.
 *
 * @param {*} n - The number of elements to drop.
 * @param {*} list - The array or string.
 *
 * @returns {*} - The result.
 */
export const dropLast = _curry2((n: number, list: any): any => list.slice(0, n < list.length ? list.length - n : 0))
