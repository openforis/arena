import { _curry2 } from './internal/_curry2'

/**
 * Checks if all the elements satisfy the predicate.
 *
 * @param {*} predicate - The predicate.
 * @param {*} list - The array.
 *
 * @returns {boolean} - The result.
 */
export const all = _curry2((predicate: (value: any) => boolean, list: any[]): boolean =>
  list.every((item) => predicate(item))
)
