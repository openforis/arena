import { _curry3 } from './internal/_curry3'

/**
 * Applies the function to the value only if the predicate is false, otherwise returns the value.
 *
 * @param {*} fn - The function applied when the predicate is false.
 */
export const unless = _curry3((predicate: (value: any) => boolean, fn: (value: any) => any, value: any): any =>
  predicate(value) ? value : fn(value)
)
