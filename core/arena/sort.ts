import { _curry2 } from './internal/_curry2'

/**
 * Returns a sorted copy of the list.
 *
 * @param {*} comparator - The comparison function.
 */
export const sort = _curry2((comparator: (a: any, b: any) => number, list: any[]): any[] => [...list].sort(comparator))
