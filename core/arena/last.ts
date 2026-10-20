import { _curry1 } from './internal/_curry1'
import { nth } from './nth'

/**
 * Returns the last element of the list or string.
 *
 * @param {*} list - The array or string.
 *
 * @returns {*} - The result.
 */
export const last = _curry1((list: any): any => nth(-1, list))
