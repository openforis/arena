import { _curry2 } from './internal/_curry2'

/**
 * Returns a new list containing the elements of the given list followed by the given element.
 *
 * @param {*} element - The element to add.
 * @param {*} list - The array.
 *
 * @returns {Array} - The result.
 */
export const append = _curry2((element: any, list: any[]): any[] => [...list, element])
