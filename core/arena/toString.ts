import { _curry1 } from './internal/_curry1'

const _toString = (value: any): string => {
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number') return Object.is(value, -0) ? '-0' : String(value)
  if (Array.isArray(value)) return `[${value.map(_toString).join(', ')}]`
  if (value !== null && typeof value === 'object' && Object.prototype.toString.call(value) === '[object Object]') {
    return `{${Object.keys(value)
      .map((key) => `${JSON.stringify(key)}: ${_toString(value[key])}`)
      .sort()
      .join(', ')}}`
  }
  return String(value)
}

/**
 * Returns a string representation of the value (strings are double quoted).
 *
 * @param {*} value - The value to convert.
 *
 * @returns {string} - The result.
 */
export const toString = _curry1(_toString)
