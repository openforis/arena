import { _curry1 } from './internal/_curry1'

/**
 * Checks if the input value is `null` or `undefined`.
 *
 * @param {*} object - The the input value.
 *
 * @returns {boolean} - True if the input value is `null` or `undefined`, false otherwise.
 */
export const isNull = _curry1((value) => value === null || value === undefined)
