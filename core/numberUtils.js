import BigNumber from 'bignumber.js'

import * as A from '@core/arena'
import { Objects } from '@openforis/arena-core'

BigNumber.config({
  ERRORS: false,
  FORMAT: {
    decimalSeparator: '.',
    groupSeparator: ',',
    groupSize: 3,
  },
})

export const toNumber = (num) => (Objects.isEmpty(num) ? NaN : Number(num))

export const isInteger = A.pipe(toNumber, Number.isInteger)

export const isFloat = A.pipe(toNumber, Number.isFinite)

/**
 * Formats the given value to the specified fixed dicimal digits.
 *
 * @param {!number} value - The value to format.
 * @param {number} [decimalDigits=2] - Number of fixed decimal digits.
 * @returns {string} - The formatted value or null if the value was null.
 */
export const formatDecimal = (value, decimalDigits = NaN) => {
  if (Number.isNaN(value) || value === null) return null
  const num = new BigNumber(value)

  if (decimalDigits >= 0) {
    // round to fixed number of decimal digits
    return num.toFormat(decimalDigits)
  }
  return num.toFormat()
}

export const roundToPrecision = (value, precision = NaN) => {
  const num = toNumber(value)
  if (Number.isNaN(num)) return NaN
  if (Number.isNaN(precision)) return num
  const exp = Math.pow(10, precision)
  return Math.round(num * exp) / exp
}

/**
 * Formats the given value to a rounded integer.
 *
 * @param {!number} value - The value to format.
 * @returns {string} - The formatted value or null if the value was null.
 */
export const formatInteger = (value) => formatDecimal(value, 0)

/**
 * Returns the modulus of the specified value. The result will always be a positive number.
 * @param {!number} modulus - The modulus to apply.
 * @returns {number} - The result of the modulus (always positive or 0).
 */
export const mod = (modulus) => (value) => ((value % modulus) + modulus) % modulus

export const limit =
  ({ minValue = null, maxValue = null }) =>
  (value) => {
    let result = Number(value)
    if (minValue) result = Math.max(minValue, result)
    if (maxValue) result = Math.min(maxValue, result)
    return result
  }
