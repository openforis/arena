import { _curry3 } from './internal/_curry3'

/**
 * Replaces the (first, unless the pattern is a global regular expression) match of the pattern in the string.
 *
 * @param {*} pattern - The pattern to search for.
 * @param {*} replacement - The replacement.
 * @param {*} value - The string to modify.
 *
 * @returns {string} - The result.
 */
export const replace = _curry3((pattern: string | RegExp, replacement: any, value: string): string =>
  value.replace(pattern as any, replacement)
)
