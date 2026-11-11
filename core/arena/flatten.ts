import { _curry1 } from './internal/_curry1'

/**
 * Flattens all the levels of a nested array.
 *
 * @param {*} list - The (nested) array.
 *
 * @returns {Array} - The result.
 */
export const flatten = _curry1((list: any[]): any[] => list.flat(Infinity))
