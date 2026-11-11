import { _curry2 } from './internal/_curry2'

/**
 * Returns a copy of the list sorted using the comparators in order (the first non-zero result wins).
 *
 * @param {*} comparators - The comparison functions.
 * @param {*} list - The array.
 *
 * @returns {Array} - The result.
 */
export const sortWith = _curry2((comparators: Array<(a: any, b: any) => number>, list: any[]): any[] =>
  [...list].sort((a, b) => {
    for (const comparator of comparators) {
      const result = comparator(a, b)
      if (result !== 0) return result
    }
    return 0
  })
)
