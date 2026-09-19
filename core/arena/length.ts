import { _curry1 } from './internal/_curry1'

/**
 * Returns the number of elements of the list or string (NaN if it has no numeric length).
 *
 * @param {*} list - The array or string.
 *
 * @returns {number} - The result.
 */
export const length = _curry1((list: any): number =>
  list !== null && list !== undefined && typeof list.length === 'number' ? list.length : Number.NaN
)
