import { _curry1 } from './internal/_curry1'
import { nth } from './nth'

/**
 * Returns the first element of the list or string.
 *
 * @param {*} list - The array or string.
 *
 * @returns {*} - The result.
 */
export const head = _curry1((list: any): any => nth(0, list))
