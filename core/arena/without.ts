import { _curry2 } from './internal/_curry2'
import { _equals } from './internal/_equals'

/**
 * Returns the list without the elements that are deeply equal to any of the given values.
 *
 * @param {*} values - The values to exclude.
 * @param {*} list - The array.
 *
 * @returns {Array} - The result.
 */
export const without = _curry2((values: any[], list: any[]): any[] =>
  list.filter((item) => !values.some((value) => _equals(value, item)))
)
