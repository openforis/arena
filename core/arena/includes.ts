import { _curry2 } from './internal/_curry2'
import { _equals } from './internal/_equals'

/**
 * Checks if the array contains the value (deep equality) or if the string contains the substring.
 *
 * @param {*} value - The value to search for.
 * @param {*} list - The array or string.
 *
 * @returns {boolean} - The result.
 */
export const includes = _curry2((value: any, list: any): boolean => {
  if (typeof list === 'string') return list.includes(value)
  return Array.from(list).some((item) => _equals(item, value))
})
