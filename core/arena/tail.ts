import { _curry1 } from './internal/_curry1'

/**
 * Returns all but the first element of the list or string.
 *
 * @param {*} list - The array or string.
 *
 * @returns {*} - The result.
 */
export const tail = _curry1((list: any): any => (list === null || list === undefined ? [] : list.slice(1)))
