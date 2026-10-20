import { _curry1 } from './internal/_curry1'

/**
 * Removes whitespace from both ends of the string.
 *
 * @param {*} value - The string to trim.
 *
 * @returns {string} - The result.
 */
export const trim = _curry1((value: string): string => value.trim())
