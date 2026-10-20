import { _curry2 } from './internal/_curry2'

/**
 * Returns the first element that satisfies the predicate.
 *
 * @param {*} predicate - The predicate.
 * @param {*} list - The array.
 *
 * @returns {*} - The result.
 */
export const find = _curry2((predicate: (value: any) => boolean, list: any[]): any =>
  list.find((item) => predicate(item))
)
