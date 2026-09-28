import { _curry1 } from './internal/_curry1'

/**
 * Converts the string to upper case.
 *
 * @param {*} value - The string to convert.
 *
 * @returns {string} - The result.
 */
export const toUpper = _curry1((value: string): string => value.toUpperCase())
