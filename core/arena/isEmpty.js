import { _curry1 } from './internal/_curry1'
import { isNull } from './isNull'

/**
 * Checks if the given value is its type's empty value.
 *
 * @param {*} value - The input value.
 *
 * @returns {boolean} - True if the input object is its type's empty value, false otherwise.
 */
export const isEmpty = _curry1((value) => {
  if (isNull(value)) return true

  if (value.constructor === Object) return Object.keys(value).length === 0
  if (value.constructor === Array) return value.length === 0
  if (value.constructor === String) return value === ''
  if (value.constructor === Set) return value.size === 0
  if (value.constructor === Map) return value.size === 0

  return false
})
