import { _curry2 } from './internal/_curry2'

/**
 * Splits a string into an array of strings using the separator.
 *
 * @param {*} separator - The separator (string or regular expression).
 * @param {*} value - The string to split.
 *
 * @returns {string[]} - The result.
 */
export const split = _curry2((separator: string | RegExp, value: string): string[] => value.split(separator as any))
