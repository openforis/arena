import { _curry1 } from './internal/_curry1'

/**
 * Checks if the input value is `null` or `undefined`.
 *
 * @param {*} value - The input value.
 *
 * @returns {boolean} - The result.
 */
export const isNil = _curry1((value: any): boolean => value === null || value === undefined)
