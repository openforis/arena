import { _curry2 } from './internal/_curry2'
import { equals } from './equals'

/**
 * Checks if the string or array starts with the given prefix.
 *
 * @param {*} prefix - The prefix (string or array).
 * @param {*} list - The string or array to check.
 *
 * @returns {boolean} - The result.
 */
export const startsWith = _curry2((prefix: any, list: any): boolean =>
  typeof list === 'string' && typeof prefix === 'string'
    ? list.startsWith(prefix)
    : equals(list.slice(0, prefix.length), prefix)
)
