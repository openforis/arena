import { _curry2 } from './internal/_curry2'
import { filter } from './filter'

/**
 * Returns the elements of the array (or entries of the object) that do not satisfy the predicate.
 *
 * @param {*} predicate - The predicate.
 * @param {*} filterable - The array or object to filter.
 *
 * @returns {*} - The result.
 */
export const reject = _curry2((predicate: (value: any) => boolean, filterable: any): any =>
  filter((value: any) => !predicate(value), filterable)
)
