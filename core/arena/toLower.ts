import { _curry1 } from './internal/_curry1'

/**
 * Converts the string to lower case.
 *
 * @param {*} value - The string to convert.
 *
 * @returns {string} - The result.
 */
export const toLower = _curry1((value: string): string => value.toLowerCase())
