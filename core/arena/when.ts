import { _curry3 } from './internal/_curry3'

/**
 * Applies the function to the value only if the predicate is true, otherwise returns the value.
 *
 * @param {*} predicate - The predicate.
 * @param {*} fn - The function applied when the predicate is true.
 * @param {*} value - The value.
 *
 * @returns {*} - The result.
 */
export const when = _curry3((predicate: (value: any) => boolean, fn: (value: any) => any, value: any): any =>
  predicate(value) ? fn(value) : value
)
