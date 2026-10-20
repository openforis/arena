import { _curry2 } from './internal/_curry2'

/**
 * Returns a sorted copy of the list.
 *
 * @param {*} comparator - The comparison function.
 * @param {*} list - The array.
 *
 * @returns {Array} - The result.
 */
export const sort = _curry2((comparator: (a: any, b: any) => number, list: any[]): any[] => [...list].sort(comparator))
