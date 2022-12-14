import * as R from 'ramda'
import BigNumber from 'bignumber.js'

BigNumber.config({
  ERRORS: false,
  FORMAT: {
    decimalSeparator: '.',
    groupSeparator: ' ',
    groupSize: 3,
  },
})

export const toNumber = (num) => (R.isNil(num) || R.isEmpty(num) ? NaN : Number(num))

export const isInteger = R.pipe(toNumber, Number.isInteger)

export const isFloat = R.pipe(toNumber, Number.isFinite)

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

  if (decimalDigits > 0) {
    // round to fixed number of decimal digits
    return num.toFormat(decimalDigits)
  }
  if (decimalDigits === 0) {
    // format as integer
    return num.toFormat(0, { groupSeparator: '' })
  }
  return num.toString()
}

/**
 * Formats the given value to a rounded integer.
 *
 * @param {!number} value - The value to format.
 * @returns {string} - The formatted value or null if the value was null.
 */
export const formatInteger = (value) => formatDecimal(value, 0)
