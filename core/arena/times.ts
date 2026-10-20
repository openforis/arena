import { _curry2 } from './internal/_curry2'

/**
 * Calls the function `n` times with the indexes 0 to n-1 and returns the results.
 *
 * @param {*} fn - The function to call with the index.
 * @param {*} n - The number of times.
 *
 * @returns {Array} - The result.
 */
export const times = _curry2((fn: (i: number) => any, n: number): any[] => Array.from({ length: n }, (_, i) => fn(i)))
