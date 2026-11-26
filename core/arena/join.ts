import { _curry2 } from './internal/_curry2'

/**
 * Joins the elements of the list into a string using the separator.
 */
export const join = _curry2((separator: string, list: any[]): string => list.join(separator))
