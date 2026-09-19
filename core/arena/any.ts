import { _curry2 } from './internal/_curry2'

/**
 * Checks if at least one element satisfies the predicate.
 *
 * @param {*} predicate - The predicate.
 * @param {*} list - The array.
 *
 * @returns {boolean} - The result.
 */
export const any = _curry2((predicate: (value: any) => boolean, list: any[]): boolean =>
  list.some((item) => predicate(item))
)
