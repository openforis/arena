import { _curry2 } from './internal/_curry2'

/**
 * Returns the index of the first element that satisfies the predicate (-1 if none).
 *
 * @param {*} predicate - The predicate.
 * @param {*} list - The array.
 *
 * @returns {number} - The result.
 */
export const findIndex = _curry2((predicate: (value: any) => boolean, list: any[]): number =>
  list.findIndex((item) => predicate(item))
)
