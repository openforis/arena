import { _curry2 } from './internal/_curry2'

/**
 * Joins the elements of the list into a string using the separator.
 *
 * @param {*} separator - The separator.
 * @param {*} list - The array.
 *
 * @returns {string} - The result.
 */
export const join = _curry2((separator: string, list: any[]): string => list.join(separator))
