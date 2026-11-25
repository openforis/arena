import { _curry2 } from './internal/_curry2'

/**
 * Returns a new list containing the elements of the given list followed by the given element.
 *
 * @param {*} element - The element to add.
 */
export const append = _curry2((element: any, list: any[]): any[] => [...list, element])
