import { _curry3 } from './internal/_curry3'

/**
 * Applies the function to the value only if the predicate is true, otherwise returns the value.
 *
 * @param {*} fn - The function applied when the predicate is true.
 */
export const when = _curry3((predicate: (value: any) => boolean, fn: (value: any) => any, value: any): any =>
  predicate(value) ? fn(value) : value
)
