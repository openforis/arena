import { _curry3 } from './internal/_curry3'

/**
 * Returns the elements of the first list for which the predicate is true for at least one element of the second list.
 *
 * @param {*} predicate - The comparison predicate.
 * @param {*} list1 - The first array.
 * @param {*} list2 - The second array.
 *
 * @returns {Array} - The result.
 */
export const innerJoin = _curry3((predicate: (a: any, b: any) => boolean, list1: any[], list2: any[]): any[] =>
  list1.filter((a) => list2.some((b) => predicate(a, b)))
)
